import qrcode from "qrcode-generator";
import { useMemo } from "react";

// A real, scannable QR code drawn as one SVG path (crisp at any size).
export function QrCode({ value, className }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: count, path: d };
  }, [value]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="QR code" className={className}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}
