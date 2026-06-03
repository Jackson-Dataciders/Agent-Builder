"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/types";
import { LANGUAGE_NAMES, type Language, type TranslationKey } from "@/lib/i18n";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClearHistory: () => void;
  t: (key: TranslationKey) => string;
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onSettingsChange,
  onClearHistory,
  t,
}: SettingsModalProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const testMode = !settings.apiKey || settings.apiKey === "test";

  const clear = () => {
    onClearHistory();
    setConfirming(true);
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{t("settings.title")}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t("settings.title")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal__field">
          <label htmlFor="set-key">{t("settings.apiKey")}</label>
          <input
            id="set-key"
            type="password"
            value={settings.apiKey}
            placeholder="sk-..."
            onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value })}
          />
          {testMode && <div className="hint">Running in test mode — enter a real key to go live.</div>}
        </div>

        <div className="modal__field">
          <label htmlFor="set-lang">{t("settings.language")}</label>
          <select
            id="set-lang"
            value={settings.language}
            onChange={(e) =>
              onSettingsChange({ ...settings, language: e.target.value as Language })
            }
          >
            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_NAMES[lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="modal__field">
          <button className="danger-btn" onClick={clear}>
            {t("settings.clearHistory")}
          </button>
          {confirming && <span className="confirm-text">{t("settings.clearConfirm")}</span>}
        </div>
      </div>
    </div>
  );
}
