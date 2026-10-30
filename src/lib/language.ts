import { useSyncExternalStore } from "react";

export type LanguageCode = "en" | "ur" | "zh";

export const languages: { code: LanguageCode; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

const STORAGE_KEY = "tabletap.language";

function readStored(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (languages.some((l) => l.code === stored)) return stored as LanguageCode;
  } catch {
    // storage blocked (private mode etc.)
  }
  return "en";
}

// One shared value, so every flag button on screen shows the same language.
let current = readStored();
const listeners = new Set<() => void>();

function setLanguage(code: LanguageCode) {
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // not critical
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The guest's chosen menu language, remembered on this device.
export function useLanguage() {
  const language = useSyncExternalStore(subscribe, () => current);
  return [language, setLanguage] as const;
}
