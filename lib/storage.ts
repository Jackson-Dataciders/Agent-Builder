import type { AgentConfig, AppMemory, Settings } from "@/types";

const KEYS = {
  agentConfig: "agent_config",
  appMemory: "app_memory",
  appSettings: "app_settings",
} as const;

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "",
  instructions: "",
  guardrails: "",
  tone: "",
  secretWord: "",
  locked: false,
};

const DEFAULT_APP_MEMORY: AppMemory = {
  summary: "",
  messages: [],
  summarizedCount: 0,
};

const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  language: "en",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export const storage = {
  getAgentConfig(): AgentConfig {
    return read(KEYS.agentConfig, DEFAULT_AGENT_CONFIG);
  },
  setAgentConfig(config: AgentConfig): void {
    write(KEYS.agentConfig, config);
  },

  getAppMemory(): AppMemory {
    return read(KEYS.appMemory, DEFAULT_APP_MEMORY);
  },
  setAppMemory(memory: AppMemory): void {
    write(KEYS.appMemory, memory);
  },

  getSettings(): Settings {
    return read(KEYS.appSettings, DEFAULT_SETTINGS);
  },
  setSettings(settings: Settings): void {
    write(KEYS.appSettings, settings);
  },
};
