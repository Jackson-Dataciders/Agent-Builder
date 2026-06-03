"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";
import { storage } from "@/lib/storage";
import { memory } from "@/lib/memory";
import type { TranslationKey } from "@/lib/i18n";
import MessageInput from "./MessageInput";

interface ChatWindowProps {
  t: (key: TranslationKey) => string;
  resetKey: number;
  agentName: string;
}

function newMessage(role: Message["role"], content: string): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

export default function ChatWindow({ t, resetKey, agentName }: ChatWindowProps) {
  const displayName = agentName.trim();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(memory.getContext().messages);
  }, [resetKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingId]);

  const handleSend = async (text: string) => {
    const userMsg = newMessage("user", text);
    const assistantMsg = newMessage("assistant", "");

    const context = memory.getContext();
    setMessages([...context.messages, userMsg, assistantMsg]);
    setStreamingId(assistantMsg.id);

    const settings = storage.getSettings();
    const agentConfig = storage.getAgentConfig();

    let assembled = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...context.messages, userMsg],
          agentConfig,
          summary: context.summary,
          apiKey: settings.apiKey,
          language: settings.language,
        }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const json = JSON.parse(payload) as { content?: string };
            if (json.content) {
              assembled += json.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: assembled } : m
                )
              );
            }
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
      await reader.cancel().catch(() => {});
    } catch (err) {
      assembled =
        assembled ||
        `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: assembled } : m
        )
      );
    } finally {
      setStreamingId(null);
      const finalAssistant = { ...assistantMsg, content: assembled };
      const updated = await memory.addMessages(userMsg, finalAssistant);
      setMessages(updated.messages);
    }
  };

  return (
    <>
      <div className="chat">
        {messages.length === 0 ? (
          <div className="chat__empty">
            <h2>{displayName || t("common.noAgentName")}</h2>
            <p>{t("chat.placeholder")}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg msg--${m.role}`}>
              <span className="msg__role">
                {m.role === "user"
                  ? t("common.you")
                  : displayName || t("common.agent")}
              </span>
              <div className="msg__bubble">
                {m.role === "assistant" ? (
                  <div className="markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
                {streamingId === m.id && <span className="cursor" />}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput t={t} streaming={streamingId !== null} onSend={handleSend} />
    </>
  );
}
