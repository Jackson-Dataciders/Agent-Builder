"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { TranslationKey } from "@/lib/i18n";

interface MessageInputProps {
  t: (key: TranslationKey) => string;
  streaming: boolean;
  onSend: (text: string) => void;
}

// Single-line height (46px) grown up to 300% before the textarea scrolls.
const BASE_HEIGHT = 46;
const MAX_HEIGHT = BASE_HEIGHT * 3;

export default function MessageInput({ t, streaming, onSend }: MessageInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || streaming) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="input-bar">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("chat.placeholder")}
        rows={1}
      />
      <button className="send-btn" onClick={submit} disabled={streaming || !value.trim()}>
        {streaming ? t("chat.streaming") : t("chat.send")}
      </button>
    </div>
  );
}
