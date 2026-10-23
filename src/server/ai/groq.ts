import { z } from "zod";
import { plainMathDeep } from "./plain-math";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_PROMPT_CHARS = 12_000;
const MAX_ATTEMPTS = 2;

export type AiErrorCode =
  | "NOT_CONFIGURED"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "INVALID_OUTPUT";

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
    case "RATE_LIMITED":
      return "AI đang quá tải. Đợi khoảng 30 giây rồi thử lại.";
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

  const requestBody = JSON.stringify({
    model: aiModel(),
    temperature: 0.4,
    // medium effort: low effort produced wrong arithmetic in answer keys; the token budget below
    // leaves room for the model's reasoning plus the JSON
    reasoning_effort: "medium",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: task, strict: true, schema: jsonSchema },
    },
  });

  let response: Response | undefined;
  // strict mode rejects output that skips required fields (json_validate_failed); one more attempt
  // usually succeeds, and the bound keeps a misbehaving model from looping
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: requestBody,
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      console.error(JSON.stringify({ event: "ai_request_failed", task, timedOut }));
      throw new AiError(timedOut ? "TIMEOUT" : "UPSTREAM", `${task}: request failed`);
    }
    if (response.ok) break;

    // Groq error bodies describe the request problem (e.g. json_validate_failed), never secrets
    const detail = await response
      .json()
      .then((data: { error?: { code?: string; message?: string } }) => data.error)
      .catch(() => undefined);
    console.error(
      JSON.stringify({
        event: "ai_http_error",
        task,
        attempt,
        status: response.status,
        code: detail?.code,
        message: detail?.message?.slice(0, 300),
      }),
    );
    if (detail?.code === "json_validate_failed" && attempt < MAX_ATTEMPTS) continue;
    // the free tier allows roughly two quiz generations per minute
    const code = response.status === 429 ? "RATE_LIMITED" : "UPSTREAM";
    throw new AiError(code, `${task}: HTTP ${response.status}`);
  }
  if (!response) throw new AiError("UPSTREAM", `${task}: no response`);

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  try {
    return schema.parse(plainMathDeep(JSON.parse(content ?? "")));
  } catch {
    console.error(JSON.stringify({ event: "ai_invalid_output", task }));
    throw new AiError("INVALID_OUTPUT", `${task}: output failed validation`);
  }
}
