import { useEffect, useRef, useState } from "react";
import { languages, useLanguage, type LanguageCode } from "../lib/language";
import { CheckIcon, ChinaFlag, PakistanFlag, UkFlag } from "./icons";

const flags: Record<LanguageCode, typeof UkFlag> = {
  en: UkFlag,
  ur: PakistanFlag,
  zh: ChinaFlag,
};

// Flag button in the top bar that opens a small language dropdown.
// `active` is false while the bar is slid away, which also closes the list.
export function LanguagePicker({ active = true }: { active?: boolean }) {
  const [language, setLanguage] = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = languages.find((l) => l.code === language)!;
  const Flag = flags[language];

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  // Close on outside tap or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`Language: ${current.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={active ? 0 : -1}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-inset transition ${
          open ? "ring-ink/40" : "ring-hairline"
        }`}
      >
        <Flag className="h-3 w-5 rounded-[2px]" />
      </button>

      <ul
        role="listbox"
        aria-label="Menu language"
        className={`absolute right-0 top-[calc(100%+8px)] z-10 w-48 origin-top-right rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-hairline transition duration-150 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {languages.map((lang) => {
          const selected = lang.code === language;
          const LangFlag = flags[lang.code];
          return (
            <li key={lang.code} role="option" aria-selected={selected}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selected ? "bg-plum/[0.07]" : "active:bg-ink/5"
                }`}
              >
                <LangFlag className="h-3 w-5 shrink-0 rounded-[2px]" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-bold leading-tight">{lang.nativeName}</span>
                  {lang.nativeName !== lang.name && (
                    <span className="text-xs font-medium text-ink-muted">{lang.name}</span>
                  )}
                </span>
                {selected && <CheckIcon className="h-4 w-4 shrink-0 text-plum" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
