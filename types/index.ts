export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  name: string;
  instructions: string;
  guardrails: string;
  tone: string;
  secretWord: string;
  locked: boolean;
}

export interface Settings {
  apiKey: string;
  language: "en" | "de" | "uk";
}

export interface AppMemory {
  summary: string;
  messages: Message[]; // FULL history — never trimmed
  summarizedCount: number; // # of leading messages folded into `summary`
}
