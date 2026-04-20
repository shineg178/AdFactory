"use client";

import { useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWizard, AspectRatio, StyleSettings } from "./WizardContext";
import { cn } from "@/lib/utils";

const FONTS = ["Pretendard", "GmarketSansMedium", "Nanum Gothic", "serif", "monospace"];
const FONT_LABELS: Record<string, string> = {
  Pretendard: "Pretendard",
  GmarketSansMedium: "지마켓 산스",
  "Nanum Gothic": "나눔고딕",
  serif: "명조체",
  monospace: "고정폭",
};

const ASPECT_RATIOS: { value: AspectRatio; label: string; w: number; h: number }[] = [
  { value: "1:1", label: "1:1", w: 1080, h: 1080 },
  { value: "4:5", label: "4:5", w: 1080, h: 1350 },
  { value: "9:16", label: "9:16", w: 1080, h: 1920 },
  { value: "16:9", label: "16:9", w: 1920, h: 1080 },
];

const BG_PRESETS = [
  "#ffffff", "#111111", "#f4f0eb", "#1a1a2e", "#0f3460",
  "#e8f5e9", "#fff3e0", "#fce4ec", "#e3f2fd", "#f3e5f5",
];

function getRatioDims(ratio: AspectRatio) {
  return ASPECT_RATIOS.find((r) => r.value === ratio)!;
}

// Draw the preview onto the canvas element
function drawPreview(canvas: HTMLCanvasElement, copy: { mainHeadline: string; subHeadline: string; cta: string }, style: StyleSettings) {
  const { w, h } = getRatioDims(style.aspectRatio);
  // Preview is scaled to fit within 400px
  const maxPx = 400;
  const scale = w >= h ? maxPx / w : maxPx / h;
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);

  canvas.width = pw;
  canvas.height = ph;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, pw, ph);

  // Background
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, pw, ph);

  const cx = pw / 2;

  // Helper: wrap text
  function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const padding = pw * 0.1;
  const maxTextWidth = pw - padding * 2;
  let y = ph * 0.3;

  // Main headline
  const mainSize = Math.round(style.mainFontSize * scale);
  ctx.fillStyle = style.mainColor;
  ctx.font = `${style.mainFontWeight} ${mainSize}px ${style.mainFontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mainLines = wrapText(copy.mainHeadline, maxTextWidth, mainSize, style.mainFontFamily);
  mainLines.forEach((line, i) => {
    ctx.font = `${style.mainFontWeight} ${mainSize}px ${style.mainFontFamily}`;
    ctx.fillStyle = style.mainColor;
    ctx.fillText(line, cx, y + i * (mainSize * 1.3));
  });
  y += mainLines.length * (mainSize * 1.3) + mainSize * 0.8;

  // Sub headline
  const subSize = Math.round(style.subFontSize * scale);
  ctx.font = `${subSize}px ${style.subFontFamily}`;
  ctx.fillStyle = style.subColor;
  const subLines = wrapText(copy.subHeadline, maxTextWidth, subSize, style.subFontFamily);
  subLines.forEach((line, i) => {
    ctx.font = `${subSize}px ${style.subFontFamily}`;
    ctx.fillStyle = style.subColor;
    ctx.fillText(line, cx, y + i * (subSize * 1.4));
  });
  y += subLines.length * (subSize * 1.4) + subSize * 1.2;

  // CTA
  if (style.showCta) {
    const ctaSize = Math.round(style.ctaFontSize * scale);
    ctx.font = `bold ${ctaSize}px ${style.ctaFontFamily}`;
    const ctaMetrics = ctx.measureText(copy.cta);
    const ctaPadX = ctaSize * 1.2;
    const ctaPadY = ctaSize * 0.6;
    const ctaW = ctaMetrics.width + ctaPadX * 2;
    const ctaH = ctaSize + ctaPadY * 2;
    const ctaX = cx - ctaW / 2;
    const ctaY = y - ctaH / 2;
    const radius = ctaH / 2;

    ctx.fillStyle = style.ctaBgColor;
    ctx.beginPath();
    ctx.moveTo(ctaX + radius, ctaY);
    ctx.lineTo(ctaX + ctaW - radius, ctaY);
    ctx.arcTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaH, radius);
    ctx.lineTo(ctaX + ctaW, ctaY + ctaH - radius);
    ctx.arcTo(ctaX + ctaW, ctaY + ctaH, ctaX, ctaY + ctaH, radius);
    ctx.lineTo(ctaX + radius, ctaY + ctaH);
    ctx.arcTo(ctaX, ctaY + ctaH, ctaX, ctaY, radius);
    ctx.lineTo(ctaX, ctaY + radius);
    ctx.arcTo(ctaX, ctaY, ctaX + ctaW, ctaY, radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = style.ctaColor;
    ctx.font = `bold ${ctaSize}px ${style.ctaFontFamily}`;
    ctx.fillText(copy.cta, cx, y);
  }
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-8 rounded-lg border border-zinc-200 overflow-hidden shrink-0" style={{ backgroundColor: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{children}</span>;
}

export default function Step2Style() {
  const { selectedCopy, style, setStyle, setStep, setExportDataUrl } = useWizard();
  const previewRef = useRef<HTMLCanvasElement>(null);

  const s = style;
  const update = useCallback(<K extends keyof StyleSettings>(key: K, val: StyleSettings[K]) => {
    setStyle((prev) => ({ ...prev, [key]: val }));
  }, [setStyle]);

  // Redraw preview whenever style or copy changes
  useEffect(() => {
    if (!previewRef.current || !selectedCopy) return;
    drawPreview(previewRef.current, selectedCopy, style);
  }, [style, selectedCopy]);

  const handleNext = () => {
    if (!previewRef.current || !selectedCopy) return;
    // Render full-resolution for export
    const { w, h } = getRatioDims(style.aspectRatio);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = w;
    exportCanvas.height = h;

    // Temporarily scale style values to full res (style values are already in "full" units)
    const fullCtx = exportCanvas.getContext("2d")!;
    fullCtx.clearRect(0, 0, w, h);

    // We reuse drawPreview logic but at full scale by creating a temp canvas matching w/h
    // drawPreview uses its own scale factor internally
    drawPreview(exportCanvas, selectedCopy, style);

    // Actually we need a full-res draw — use a dedicated full-res helper
    drawFullRes(exportCanvas, selectedCopy, style, w, h);

    setExportDataUrl(exportCanvas.toDataURL("image/png"));
    setStep(3);
  };

  return (
    <div className="flex gap-8 w-full max-w-5xl mx-auto">
      {/* Controls */}
      <div className="w-72 shrink-0 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            Step 2
          </div>
          <h2 className="text-xl font-black text-zinc-900">스타일 설정</h2>
        </div>

        {/* Aspect ratio */}
        <div className="space-y-2">
          <Label>비율</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => update("aspectRatio", r.value)}
                className={cn(
                  "py-1.5 rounded-lg text-[11px] font-bold border transition-all",
                  s.aspectRatio === r.value ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="space-y-2">
          <Label>배경색</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {BG_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update("bgColor", c)}
                style={{ backgroundColor: c }}
                className={cn("size-6 rounded-md border transition-all", s.bgColor === c ? "ring-2 ring-indigo-500 ring-offset-1" : "border-zinc-200")}
              />
            ))}
          </div>
          <ColorSwatch value={s.bgColor} onChange={(v) => update("bgColor", v)} />
        </div>

        {/* Main headline */}
        <div className="space-y-2 border-t pt-4">
          <Label>메인 카피</Label>
          <select value={s.mainFontFamily} onChange={(e) => update("mainFontFamily", e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
            {FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f] || f}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="range" min={24} max={120} value={s.mainFontSize} onChange={(e) => update("mainFontSize", +e.target.value)} className="flex-1 accent-indigo-500" />
            <span className="text-xs font-mono font-bold text-zinc-500 w-8 text-right">{s.mainFontSize}</span>
          </div>
          <div className="flex gap-2">
            <ColorSwatch value={s.mainColor} onChange={(v) => update("mainColor", v)} />
            <button
              onClick={() => update("mainFontWeight", s.mainFontWeight === "bold" ? "normal" : "bold")}
              className={cn("px-3 py-1 rounded-lg text-xs font-black border transition-all", s.mainFontWeight === "bold" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500")}
            >B</button>
          </div>
        </div>

        {/* Sub headline */}
        <div className="space-y-2 border-t pt-4">
          <Label>서브 카피</Label>
          <select value={s.subFontFamily} onChange={(e) => update("subFontFamily", e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
            {FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f] || f}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="range" min={12} max={60} value={s.subFontSize} onChange={(e) => update("subFontSize", +e.target.value)} className="flex-1 accent-indigo-500" />
            <span className="text-xs font-mono font-bold text-zinc-500 w-8 text-right">{s.subFontSize}</span>
          </div>
          <ColorSwatch value={s.subColor} onChange={(v) => update("subColor", v)} />
        </div>

        {/* CTA */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>CTA 버튼</Label>
            <button
              onClick={() => update("showCta", !s.showCta)}
              className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full transition-all", s.showCta ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-400")}
            >
              {s.showCta ? "표시" : "숨김"}
            </button>
          </div>
          {s.showCta && (
            <>
              <select value={s.ctaFontFamily} onChange={(e) => update("ctaFontFamily", e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
                {FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f] || f}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input type="range" min={12} max={48} value={s.ctaFontSize} onChange={(e) => update("ctaFontSize", +e.target.value)} className="flex-1 accent-indigo-500" />
                <span className="text-xs font-mono font-bold text-zinc-500 w-8 text-right">{s.ctaFontSize}</span>
              </div>
              <div className="space-y-1.5">
                <div className="text-[9px] text-zinc-400 font-bold">글자색</div>
                <ColorSwatch value={s.ctaColor} onChange={(v) => update("ctaColor", v)} />
                <div className="text-[9px] text-zinc-400 font-bold">버튼 배경</div>
                <ColorSwatch value={s.ctaBgColor} onChange={(v) => update("ctaBgColor", v)} />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
            <ChevronLeft className="size-4" /> 이전
          </button>
          <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.98]">
            내보내기 <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center bg-zinc-100 rounded-3xl p-6 min-h-125">
        <div className="shadow-2xl rounded-xl overflow-hidden">
          <canvas ref={previewRef} style={{ display: "block", maxWidth: "400px", maxHeight: "400px" }} />
        </div>
      </div>
    </div>
  );
}

// Full-resolution draw (no internal scaling)
function drawFullRes(canvas: HTMLCanvasElement, copy: { mainHeadline: string; subHeadline: string; cta: string }, style: StyleSettings, w: number, h: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const padding = w * 0.1;
  const maxTextWidth = w - padding * 2;

  function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  let y = h * 0.3;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Main
  const mainSize = style.mainFontSize;
  ctx.font = `${style.mainFontWeight} ${mainSize}px ${style.mainFontFamily}`;
  ctx.fillStyle = style.mainColor;
  const mainLines = wrapText(copy.mainHeadline, maxTextWidth, mainSize, style.mainFontFamily);
  mainLines.forEach((line, i) => {
    ctx.font = `${style.mainFontWeight} ${mainSize}px ${style.mainFontFamily}`;
    ctx.fillStyle = style.mainColor;
    ctx.fillText(line, cx, y + i * (mainSize * 1.3));
  });
  y += mainLines.length * (mainSize * 1.3) + mainSize * 0.8;

  // Sub
  const subSize = style.subFontSize;
  ctx.font = `${subSize}px ${style.subFontFamily}`;
  ctx.fillStyle = style.subColor;
  const subLines = wrapText(copy.subHeadline, maxTextWidth, subSize, style.subFontFamily);
  subLines.forEach((line, i) => {
    ctx.font = `${subSize}px ${style.subFontFamily}`;
    ctx.fillStyle = style.subColor;
    ctx.fillText(line, cx, y + i * (subSize * 1.4));
  });
  y += subLines.length * (subSize * 1.4) + subSize * 1.2;

  // CTA
  if (style.showCta) {
    const ctaSize = style.ctaFontSize;
    ctx.font = `bold ${ctaSize}px ${style.ctaFontFamily}`;
    const ctaMetrics = ctx.measureText(copy.cta);
    const ctaPadX = ctaSize * 1.2;
    const ctaPadY = ctaSize * 0.6;
    const ctaW = ctaMetrics.width + ctaPadX * 2;
    const ctaH = ctaSize + ctaPadY * 2;
    const ctaX = cx - ctaW / 2;
    const ctaY = y - ctaH / 2;
    const radius = ctaH / 2;

    ctx.fillStyle = style.ctaBgColor;
    ctx.beginPath();
    ctx.moveTo(ctaX + radius, ctaY);
    ctx.lineTo(ctaX + ctaW - radius, ctaY);
    ctx.arcTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaH, radius);
    ctx.lineTo(ctaX + ctaW, ctaY + ctaH - radius);
    ctx.arcTo(ctaX + ctaW, ctaY + ctaH, ctaX, ctaY + ctaH, radius);
    ctx.lineTo(ctaX + radius, ctaY + ctaH);
    ctx.arcTo(ctaX, ctaY + ctaH, ctaX, ctaY, radius);
    ctx.lineTo(ctaX, ctaY + radius);
    ctx.arcTo(ctaX, ctaY, ctaX + ctaW, ctaY, radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = style.ctaColor;
    ctx.font = `bold ${ctaSize}px ${style.ctaFontFamily}`;
    ctx.fillText(copy.cta, cx, y);
  }
}
