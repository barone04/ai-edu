import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_PROMPT_CHARS = 12_000;

export type AiErrorCode = "NOT_CONFIGURED" | "TIMEOUT" | "UPSTREAM" | "INVALID_OUTPUT";

export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

// Teacher-facing Vietnamese message for each failure; internal details stay in server logs.
export function aiErrorMessage(error: unknown): string {
  const code = error instanceof AiError ? error.code : "UPSTREAM";
  switch (code) {
    case "NOT_CONFIGURED":
      return "Chưa cấu hình AI trên máy chủ. Bạn có thể tự soạn câu hỏi.";
    case "TIMEOUT":
      return "AI phản hồi quá lâu. Hãy kiểm tra mạng và thử lại.";
    case "INVALID_OUTPUT":
      return "AI trả về kết quả chưa hợp lệ. Hãy thử lại hoặc tự soạn.";
    default:
      return "Không kết nối được tới AI. Hãy thử lại sau ít phút.";
  }
}

export function aiModel(): string {
  return process.env.GROQ_MODEL || "openai/gpt-oss-120b";
}

type JsonRequest<T> = {
  task: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
};

export async function generateJson<T>({ task, system, user, schema }: JsonRequest<T>): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AiError("NOT_CONFIGURED", "GROQ_API_KEY is not set");
  if (system.length + user.length > MAX_PROMPT_CHARS) {
    throw new AiError("INVALID_OUTPUT", `${task}: prompt exceeds ${MAX_PROMPT_CHARS} chars`);
  }

  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: aiModel(),
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: task, strict: true, schema: jsonSchema },
        },
      }),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    console.error(JSON.stringify({ event: "ai_request_failed", task, timedOut }));
    throw new AiError(timedOut ? "TIMEOUT" : "UPSTREAM", `${task}: request failed`);
  }

  if (!response.ok) {
    console.error(JSON.stringify({ event: "ai_http_error", task, status: response.status }));
    throw new AiError("UPSTREAM", `${task}: HTTP ${response.status}`);
  }

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  try {
    return schema.parse(JSON.parse(content ?? ""));
  } catch {
    console.error(JSON.stringify({ event: "ai_invalid_output", task }));
    throw new AiError("INVALID_OUTPUT", `${task}: output failed validation`);
  }
}
