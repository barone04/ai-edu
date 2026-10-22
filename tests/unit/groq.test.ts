import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AiError, aiErrorMessage, generateJson } from "@/server/ai/groq";

const schema = z.object({ answer: z.string() });
const request = { task: "test", system: "system", user: "user", schema };

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function completion(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

describe("generateJson", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns schema-valid output and sends a strict json schema", async () => {
    const fetchMock = mockFetch(completion('{"answer":"3/4"}'));

    await expect(generateJson(request)).resolves.toEqual({ answer: "3/4" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.$schema).toBeUndefined();
  });

  it("fails clearly when no api key is configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = mockFetch(completion("{}"));

    await expect(generateJson(request)).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps http errors to an upstream error", async () => {
    mockFetch(new Response("busy", { status: 503 }));

    await expect(generateJson(request)).rejects.toMatchObject({ code: "UPSTREAM" });
  });

  it("maps timeouts to a timeout error", async () => {
    mockFetch(new DOMException("timed out", "TimeoutError"));

    await expect(generateJson(request)).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("rejects output that does not match the schema", async () => {
    mockFetch(completion('{"wrong":1}'));

    await expect(generateJson(request)).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
  });
});

describe("aiErrorMessage", () => {
  it("gives teachers a Vietnamese message without internal details", () => {
    const message = aiErrorMessage(new AiError("UPSTREAM", "HTTP 503 from api.groq.com"));

    expect(message).toBe("Không kết nối được tới AI. Hãy thử lại sau ít phút.");
  });
});
