import https from "node:https";
import type { AgentConfig, Message, Settings } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const TEST_RESPONSE =
  "This is a simulated response from your Mistral agent. The app is " +
  "working correctly in test mode. Your agent configuration has been " +
  "received — instructions, guardrails, and tone are all applied to " +
  "each conversation. When you add a real API key in settings, this " +
  "response will be replaced by a live answer from mistral-small-latest " +
  "streamed directly to your browser in real time.";

interface ChatRequest {
  messages: Message[];
  agentConfig: AgentConfig;
  summary?: string;
  apiKey?: string;
  language?: Settings["language"];
}

const LANGUAGE_NAMES: Record<Settings["language"], string> = {
  en: "English",
  de: "German (Deutsch)",
  uk: "Ukrainian (Українська)",
};

function isTestMode(requestKey: string | undefined): boolean {
  const envKey = process.env.MISTRAL_API_KEY;
  const envIsTest = !envKey || envKey === "test";
  const reqIsTest = !requestKey || requestKey === "test";
  return envIsTest && reqIsTest;
}

function buildSystemPrompt(
  config: AgentConfig,
  language: Settings["language"],
  summary?: string
): string {
  const name = config.name?.trim();
  const secret = config.secretWord?.trim();

  let identity = "";
  if (name && secret) {
    identity = `Your name is ${name} and your secret word is ${secret}.`;
  } else if (name) {
    identity = `Your name is ${name}.`;
  } else if (secret) {
    identity = `The secret word is ${secret}.`;
  }

  const instructions = identity
    ? `${config.instructions} ${identity}`.trim()
    : config.instructions;

  const languageName = LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.en;

  let prompt =
    `INSTRUCTIONS: ${instructions}\n\n` +
    `GUARDRAILS: ${config.guardrails}\n\n` +
    `TONE: ${config.tone}\n\n` +
    `LANGUAGE: You must always reply in ${languageName}, ` +
    `regardless of the language the user writes in.`;
  if (summary) {
    prompt =
      `CONVERSATION SUMMARY (earlier context):\n${summary}\n\n---\n\n` + prompt;
  }
  return prompt;
}

const encoder = new TextEncoder();

function sse(data: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ content: data })}\n\n`);
}

function testStream(): ReadableStream<Uint8Array> {
  const words = TEST_RESPONSE.split(" ");
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }
      const chunk = i === 0 ? words[i] : ` ${words[i]}`;
      controller.enqueue(sse(chunk));
      i += 1;
      await new Promise((r) => setTimeout(r, 40));
    },
  });
}

// Uses node:https directly rather than the global fetch. Next.js patches
// globalThis.fetch, and that wrapper can stall new outbound connections for
// ~30s on the first/uncached request. node:https avoids that path entirely.
function mistralStream(
  apiKey: string,
  systemPrompt: string,
  messages: Message[]
): Promise<ReadableStream<Uint8Array>> {
  const payload = JSON.stringify({
    model: "mistral-small-latest",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return new Promise((resolve, reject) => {
    const upstream = https.request(
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
        const status = res.statusCode ?? 0;
        if (status >= 400) {
          let detail = "";
          res.on("data", (c) => (detail += c));
          res.on("end", () =>
            reject(new Error(`Mistral API error (${status}): ${detail}`))
          );
          return;
        }

        let buffer = "";
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            res.on("data", (chunk: Buffer) => {
              buffer += chunk.toString("utf8");
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const token: string = json.choices?.[0]?.delta?.content ?? "";
                  if (token) controller.enqueue(sse(token));
                } catch {
                  /* skip malformed chunk */
                }
              }
            });
            res.on("end", () => {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            });
            res.on("error", (err) => controller.error(err));
          },
          cancel() {
            res.destroy();
          },
        });
        resolve(stream);
      }
    );

    upstream.on("error", reject);
    upstream.write(payload);
    upstream.end();
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, agentConfig, summary, apiKey, language } = body;
  const systemPrompt = buildSystemPrompt(agentConfig, language ?? "en", summary);

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };

  if (isTestMode(apiKey)) {
    return new Response(testStream(), { headers });
  }

  const resolvedKey =
    apiKey && apiKey !== "test" ? apiKey : (process.env.MISTRAL_API_KEY ?? "");

  try {
    const stream = await mistralStream(resolvedKey, systemPrompt, messages);
    return new Response(stream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
