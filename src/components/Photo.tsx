import { useState } from "react";
import { asset } from "../lib/asset";

// An <img> that falls back to a neutral tile when the file is missing, so
// screens still lay out correctly before the real photos are exported.
export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`overflow-hidden bg-black/[0.06] ${className}`}>
      {!failed && (
        <img src={asset(src)} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" />
      )}
    </div>
  );
}
