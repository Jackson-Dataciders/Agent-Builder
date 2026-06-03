import https from "node:https";
import type { Message } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const TEST_SUMMARY =
  "Earlier in this conversation, the user explored the agent's " +
  "capabilities and received several responses. [Test mode summary]";

const SUMMARIZE_SYSTEM =
  "Summarize the following conversation concisely in 2-4 sentences. " +
  "Focus on key topics and decisions. Output only the summary, no preamble.";

interface SummarizeRequest {
  messages: Message[];
  apiKey?: string;
}

function isTestMode(requestKey: string | undefined): boolean {
  const envKey = process.env.MISTRAL_API_KEY;
  const envIsTest = !envKey || envKey === "test";
  const reqIsTest = !requestKey || requestKey === "test";
  return envIsTest && reqIsTest;
}

// node:https request (see note in api/chat/route.ts about avoiding the
// patched global fetch). Resolves with status + raw response body.
function mistralRequest(
  apiKey: string,
  payload: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.mistral.ai",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: SummarizeRequest;
  try {
    body = (await req.json()) as SummarizeRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isTestMode(body.apiKey)) {
    return Response.json({ summary: TEST_SUMMARY });
  }

  const apiKey =
    body.apiKey && body.apiKey !== "test"
      ? body.apiKey
      : (process.env.MISTRAL_API_KEY ?? "");

  const transcript = body.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const payload = JSON.stringify({
    model: "mistral-small-latest",
    stream: false,
    messages: [
      { role: "system", content: SUMMARIZE_SYSTEM },
      { role: "user", content: transcript },
    ],
  });

  try {
    const res = await mistralRequest(apiKey, payload);

    if (res.status >= 400) {
      return new Response(
        JSON.stringify({ error: `Mistral API error (${res.status}): ${res.body}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(res.body);
    const summary: string = data.choices?.[0]?.message?.content ?? "";
    return Response.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
