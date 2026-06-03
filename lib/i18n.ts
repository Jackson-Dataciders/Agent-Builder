import type { Settings } from "@/types";

export type Language = Settings["language"];

export type TranslationKey =
  | "agentPanel.title"
  | "agentPanel.name"
  | "agentPanel.instructions"
  | "agentPanel.guardrails"
  | "agentPanel.tone"
  | "agentPanel.example"
  | "agentPanel.secret"
  | "agentPanel.lock"
  | "agentPanel.unlock"
  | "agentPanel.lockedMsg"
  | "agentPanel.wrongSecret"
  | "agentPanel.collapse"
  | "agentPanel.expand"
  | "chat.placeholder"
  | "chat.send"
  | "chat.clear"
  | "chat.streaming"
  | "settings.title"
  | "settings.apiKey"
  | "settings.language"
  | "settings.clearHistory"
  | "settings.clearConfirm"
  | "common.you"
  | "common.agent"
  | "common.noAgentName";

type Dictionary = Record<TranslationKey, string>;

const en: Dictionary = {
  "agentPanel.title": "Agent Configuration",
  "agentPanel.name": "Agent Name",
  "agentPanel.instructions": "Instructions",
  "agentPanel.guardrails": "Guardrails",
  "agentPanel.tone": "Tone",
  "agentPanel.example": "Load example agent",
  "agentPanel.secret": "Secret Word",
  "agentPanel.lock": "Lock configuration",
  "agentPanel.unlock": "Unlock",
  "agentPanel.lockedMsg": "Configuration locked. Enter the secret word to unlock.",
  "agentPanel.wrongSecret": "Incorrect secret word.",
  "agentPanel.collapse": "Hide configuration",
  "agentPanel.expand": "Configure agent",
  "chat.placeholder": "Message your agent…",
  "chat.send": "Send",
  "chat.clear": "Clear chat",
  "chat.streaming": "Thinking…",
  "settings.title": "Settings",
  "settings.apiKey": "Mistral API Key",
  "settings.language": "Language",
  "settings.clearHistory": "Clear conversation history",
  "settings.clearConfirm": "Conversation history cleared.",
  "common.you": "You",
  "common.agent": "Agent",
  "common.noAgentName": "Your Agent",
};

const de: Dictionary = {
  "agentPanel.title": "Agentenkonfiguration",
  "agentPanel.name": "Name des Agenten",
  "agentPanel.instructions": "Anweisungen",
  "agentPanel.guardrails": "Leitplanken",
  "agentPanel.tone": "Tonfall",
  "agentPanel.example": "Beispiel-Agent laden",
  "agentPanel.secret": "Geheimes Wort",
  "agentPanel.lock": "Konfiguration sperren",
  "agentPanel.unlock": "Entsperren",
  "agentPanel.lockedMsg": "Konfiguration gesperrt. Gib das geheime Wort ein, um sie zu entsperren.",
  "agentPanel.wrongSecret": "Falsches geheimes Wort.",
  "agentPanel.collapse": "Konfiguration ausblenden",
  "agentPanel.expand": "Agent konfigurieren",
  "chat.placeholder": "Schreibe deinem Agenten…",
  "chat.send": "Senden",
  "chat.clear": "Chat löschen",
  "chat.streaming": "Denkt nach…",
  "settings.title": "Einstellungen",
  "settings.apiKey": "Mistral API-Schlüssel",
  "settings.language": "Sprache",
  "settings.clearHistory": "Gesprächsverlauf löschen",
  "settings.clearConfirm": "Gesprächsverlauf gelöscht.",
  "common.you": "Du",
  "common.agent": "Agent",
  "common.noAgentName": "Dein Agent",
};

const uk: Dictionary = {
  "agentPanel.title": "Налаштування агента",
  "agentPanel.name": "Ім'я агента",
  "agentPanel.instructions": "Інструкції",
  "agentPanel.guardrails": "Обмеження",
  "agentPanel.tone": "Тон",
  "agentPanel.example": "Завантажити приклад агента",
  "agentPanel.secret": "Таємне слово",
  "agentPanel.lock": "Заблокувати налаштування",
  "agentPanel.unlock": "Розблокувати",
  "agentPanel.lockedMsg": "Налаштування заблоковано. Введіть таємне слово, щоб розблокувати.",
  "agentPanel.wrongSecret": "Невірне таємне слово.",
  "agentPanel.collapse": "Сховати налаштування",
  "agentPanel.expand": "Налаштувати агента",
  "chat.placeholder": "Напишіть своєму агенту…",
  "chat.send": "Надіслати",
  "chat.clear": "Очистити чат",
  "chat.streaming": "Думає…",
  "settings.title": "Налаштування",
  "settings.apiKey": "Ключ API Mistral",
  "settings.language": "Мова",
  "settings.clearHistory": "Очистити історію розмови",
  "settings.clearConfirm": "Історію розмови очищено.",
  "common.you": "Ви",
  "common.agent": "Агент",
  "common.noAgentName": "Ваш агент",
};

const dictionaries: Record<Language, Dictionary> = { en, de, uk };

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  de: "Deutsch",
  uk: "Українська",
};

export function createTranslator(language: Language) {
  const dict = dictionaries[language] ?? en;
  return (key: TranslationKey): string => dict[key] ?? en[key];
}
