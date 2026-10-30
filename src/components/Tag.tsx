import type { MenuTag } from "../lib/menu";
import { FlameIcon, LeafIcon } from "./icons";

const tagStyles: Record<MenuTag, { label: string; Icon: typeof FlameIcon }> = {
  bestseller: { label: "Bestseller", Icon: FlameIcon },
  vegan: { label: "Vegan", Icon: LeafIcon },
};

// Outlined "BESTSELLER" / "VEGAN" pill. `compact` is the tighter version
// used on the dish sheet.
export function Tag({ tag, compact }: { tag: MenuTag; compact?: boolean }) {
  const { label, Icon } = tagStyles[tag];
  return (
    <span
      className={`flex items-center gap-[5px] self-start rounded-[10px] ring-1 ring-inset ring-hairline ${
        compact ? "px-3 py-2" : "p-3"
      }`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      <span className="text-xs font-medium uppercase leading-none tracking-[0.03em]">{label}</span>
    </span>
  );
}
