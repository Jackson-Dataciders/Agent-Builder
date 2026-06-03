import type { AppMemory, Message } from "@/types";
import { storage } from "@/lib/storage";

const MAX_RETAINED = 10;

async function summarizeOverflow(overflow: Message[]): Promise<string> {
  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: overflow }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { summary?: string };
    return data.summary ?? "";
  } catch {
    return "";
  }
}

export const memory = {
  getContext(): AppMemory {
    return storage.getAppMemory();
  },

  clearHistory(): AppMemory {
    const fresh: AppMemory = { summary: "", messages: [] };
    storage.setAppMemory(fresh);
    return fresh;
  },

  async addMessages(
    userMsg: Message,
    assistantMsg: Message
  ): Promise<AppMemory> {
    const current = storage.getAppMemory();
    let summary = current.summary;
    let messages = [...current.messages, userMsg, assistantMsg];

    if (messages.length > MAX_RETAINED) {
      const overflow = messages.slice(0, messages.length - MAX_RETAINED);
      const newSummary = await summarizeOverflow(overflow);
      if (newSummary) {
        summary = summary ? `${summary}\n${newSummary}` : newSummary;
      }
      messages = messages.slice(messages.length - MAX_RETAINED);
    }

    const updated: AppMemory = { summary, messages };
    storage.setAppMemory(updated);
    return updated;
  },
};
