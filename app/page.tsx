"use client";

import { useEffect, useMemo, useState } from "react";
import type { Settings } from "@/types";
import { storage } from "@/lib/storage";
import { memory } from "@/lib/memory";
import { createTranslator } from "@/lib/i18n";
import AgentPanel from "@/components/AgentPanel";
import ChatWindow from "@/components/ChatWindow";
import SettingsModal from "@/components/SettingsModal";

export default function Home() {
  const [settings, setSettings] = useState<Settings>({ apiKey: "", language: "en" });
  const [agentName, setAgentName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const t = useMemo(() => createTranslator(settings.language), [settings.language]);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    storage.setSettings(next);
  };

  const clearHistory = () => {
    memory.clearHistory();
    setResetKey((k) => k + 1);
  };

  return (
    <div className="app">
      <AgentPanel
        t={t}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onAgentNameChange={setAgentName}
      />

      <main className="main">
        <header className="header">
          <div className="header__title">
            Agent <span>Studio</span>
          </div>
          <div className="header__actions">
            <button className="clear-btn" onClick={clearHistory}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              <span className="clear-btn__label">{t("chat.clear")}</span>
            </button>
            <button className="icon-btn" onClick={() => setModalOpen(true)} aria-label={t("settings.title")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        <ChatWindow t={t} resetKey={resetKey} agentName={agentName} />
      </main>

      <button
        className="panel-toggle"
        onClick={() => setPanelOpen((o) => !o)}
        aria-label={t(panelOpen ? "agentPanel.collapse" : "agentPanel.expand")}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M12 8v4l3 2" />
        </svg>
      </button>

      <SettingsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        settings={settings}
        onSettingsChange={updateSettings}
        onClearHistory={clearHistory}
        t={t}
      />
    </div>
  );
}
