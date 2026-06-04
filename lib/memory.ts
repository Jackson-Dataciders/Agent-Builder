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

  getApiContext(): { summary: string; messages: Message[] } {
    const { summary, messages, summarizedCount } = storage.getAppMemory();
    return { summary, messages: messages.slice(summarizedCount) };
  },

  clearHistory(): AppMemory {
    const fresh: AppMemory = { summary: "", messages: [], summarizedCount: 0 };
    storage.setAppMemory(fresh);
    return fresh;
  },

  async addMessages(
    userMsg: Message,
    assistantMsg: Message
  ): Promise<AppMemory> {
    const current = storage.getAppMemory();
    let summary = current.summary;
    let summarizedCount = current.summarizedCount;
    const messages = [...current.messages, userMsg, assistantMsg]; // full, kept

    const rawCount = messages.length - summarizedCount;
    if (rawCount > MAX_RETAINED) {
      const overflowEnd = messages.length - MAX_RETAINED; // exclusive
      const overflow = messages.slice(summarizedCount, overflowEnd);
      const newSummary = await summarizeOverflow(overflow);
      if (newSummary) {
        summary = summary ? `${summary}\n${newSummary}` : newSummary;
      }
      summarizedCount = overflowEnd; // fold overflow into summary, keep raw tail
    }

    const updated: AppMemory = { summary, messages, summarizedCount };
    storage.setAppMemory(updated);
    return updated;
  },
};
