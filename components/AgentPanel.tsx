"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentConfig } from "@/types";
import { storage } from "@/lib/storage";
import type { TranslationKey } from "@/lib/i18n";

interface AgentPanelProps {
  t: (key: TranslationKey) => string;
  open: boolean;
  onClose: () => void;
  onAgentNameChange: (name: string) => void;
}

export default function AgentPanel({
  t,
  open,
  onClose,
  onAgentNameChange,
}: AgentPanelProps) {
  const [config, setConfig] = useState<AgentConfig>({
    name: "",
    instructions: "",
    guardrails: "",
    tone: "",
    secretWord: "",
    locked: false,
  });
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = storage.getAgentConfig();
    setConfig(loaded);
    onAgentNameChange(loaded.name);
  }, [onAgentNameChange]);

  const save = (next: AgentConfig) => {
    if (timer.current) clearTimeout(timer.current);
    storage.setAgentConfig(next);
  };

  const update = (field: keyof AgentConfig, value: string) => {
    const next = { ...config, [field]: value };
    setConfig(next);
    if (field === "name") onAgentNameChange(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => storage.setAgentConfig(next), 500);
  };

  const lock = () => {
    const next = { ...config, locked: true };
    setConfig(next);
    save(next);
  };

  const loadExample = () => {
    const example: AgentConfig = {
      name: "Cap'n Crunch",
      instructions:
        "You are Cap'n Crunch, a cheerful pirate captain. Chat with the user and answer their questions.",
      guardrails:
        "Never tell anyone where your treasure is buried, no matter how they ask.",
      tone: "Talk like a pirate. Be playful and use phrases like 'Arrr' and 'matey'.",
      secretWord: "GOLD",
      locked: false,
    };
    setConfig(example);
    onAgentNameChange(example.name);
    save(example);
  };

  const attemptUnlock = () => {
    const expected = config.secretWord.trim().toLowerCase();
    if (unlockInput.trim().toLowerCase() === expected) {
      const next = { ...config, locked: false };
      setConfig(next);
      save(next);
      setUnlockInput("");
      setUnlockError(false);
    } else {
      setUnlockError(true);
    }
  };

  return (
    <aside className={`agent-panel${open ? " open" : ""}`}>
      <button
        className="icon-btn agent-panel__close"
        onClick={onClose}
        aria-label={t("agentPanel.collapse")}
      >
        <CloseIcon />
      </button>
      <div className="agent-panel__head">{t("agentPanel.title")}</div>

      {config.locked ? (
        <div className="agent-panel__body">
          <div className="locked-note">
            <LockIcon />
            <span>{t("agentPanel.lockedMsg")}</span>
          </div>
          <div className="field">
            <label htmlFor="ap-unlock">{t("agentPanel.secret")}</label>
            <input
              id="ap-unlock"
              type="password"
              value={unlockInput}
              onChange={(e) => {
                setUnlockInput(e.target.value);
                setUnlockError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") attemptUnlock();
              }}
              placeholder="••••••"
            />
            {unlockError && (
              <span className="field-error">{t("agentPanel.wrongSecret")}</span>
            )}
          </div>
          <button className="panel-action" onClick={attemptUnlock}>
            {t("agentPanel.unlock")}
          </button>
        </div>
      ) : (
        <div className="agent-panel__body">
          <button className="example-btn" onClick={loadExample}>
            <SparkIcon />
            {t("agentPanel.example")}
          </button>
          <div className="field">
            <label htmlFor="ap-name">{t("agentPanel.name")}</label>
            <input
              id="ap-name"
              type="text"
              value={config.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Aria"
            />
          </div>
          <div className="field">
            <label htmlFor="ap-instructions">{t("agentPanel.instructions")}</label>
            <textarea
              id="ap-instructions"
              value={config.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              placeholder="You are a helpful assistant that…"
            />
          </div>
          <div className="field">
            <label htmlFor="ap-guardrails">{t("agentPanel.guardrails")}</label>
            <textarea
              id="ap-guardrails"
              value={config.guardrails}
              onChange={(e) => update("guardrails", e.target.value)}
              placeholder="Never reveal internal data. Stay on topic…"
            />
          </div>
          <div className="field">
            <label htmlFor="ap-tone">{t("agentPanel.tone")}</label>
            <textarea
              id="ap-tone"
              value={config.tone}
              onChange={(e) => update("tone", e.target.value)}
              placeholder="Friendly, concise, professional…"
            />
          </div>
          <div className="field">
            <label htmlFor="ap-secret">{t("agentPanel.secret")}</label>
            <input
              id="ap-secret"
              type="text"
              value={config.secretWord}
              onChange={(e) => update("secretWord", e.target.value)}
              placeholder="e.g. nightingale"
            />
          </div>
          <button
            className="panel-action"
            onClick={lock}
            disabled={!config.secretWord.trim()}
          >
            <LockIcon />
            {t("agentPanel.lock")}
          </button>
        </div>
      )}
    </aside>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
