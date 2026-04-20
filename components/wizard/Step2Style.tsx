"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Upload, Monitor, Search, X } from "lucide-react";
import { useWizard, StyleSettings } from "./WizardContext";
import { cn } from "@/lib/utils";

// canvas ctx.font 에 쓸 때 공백 있는 이름은 따옴표 필요, 제네릭(serif 등)은 따옴표 없어야 함
const GENERIC_FONTS = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy"]);
function cssFontFamily(name: string) {
  return GENERIC_FONTS.has(name) ? name : `"${name}"`;
}

const BUILTIN_FONTS = ["Pretendard Variable", "GmarketSans", "Nanum Gothic", "serif", "monospace"];
const BUILTIN_FONT_LABELS: Record<string, string> = {
  "Pretendard Variable": "Pretendard",
  GmarketSans: "지마켓 산스",
  "Nanum Gothic": "나눔고딕",
  serif: "명조체",
  monospace: "고정폭",
};

// 투명 버튼 포함 총 10개가 한 줄에 들어가도록 9개 유지
const BG_PRESETS = [
  "#ffffff", "#111111", "#f4f0eb", "#1a1a2e", "#0f3460",
  "#e8f5e9", "#fff3e0", "#fce4ec", "#f3e5f5",
];

// ─────────────────────────────────────────────
// Canvas draw
// ─────────────────────────────────────────────
function drawCanvas(
  canvas: HTMLCanvasElement,
  copy: { mainHeadline: string; subHeadline: string; cta: string },
  style: StyleSettings,
  w: number,
  h: number
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  if (style.bgColor !== "transparent") {
    ctx.fillStyle = style.bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] {
    ctx.font = `${fontSize}px ${cssFontFamily(fontFamily)}`;
    const words = text.split(/\s+/);
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

  function drawTextWithStroke(
    text: string, x: number, y: number,
    strokeColor: string, strokeWidth: number
  ) {
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
  }

  const cx = w / 2;
  const padding = w * 0.1;
  const maxTextWidth = w - padding * 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let y = h * 0.28;

  // Main
  const mainSize = style.mainFontSize;
  const mainLines = wrapText(copy.mainHeadline, maxTextWidth, mainSize, style.mainFontFamily);
  const mainStartY = y + h * (style.mainOffsetY / 100);
  mainLines.forEach((line, i) => {
    ctx.font = `${style.mainFontWeight} ${mainSize}px ${cssFontFamily(style.mainFontFamily)}`;
    ctx.fillStyle = style.mainColor;
    drawTextWithStroke(line, cx, mainStartY + i * (mainSize * 1.3), style.mainStrokeColor, style.mainStrokeWidth);
  });
  y += mainLines.length * (mainSize * 1.3) + mainSize * 0.7;

  // Sub
  if (copy.subHeadline) {
    const subSize = style.subFontSize;
    const subLines = wrapText(copy.subHeadline, maxTextWidth, subSize, style.subFontFamily);
    const subStartY = y + h * (style.subOffsetY / 100);
    subLines.forEach((line, i) => {
      ctx.font = `${subSize}px ${cssFontFamily(style.subFontFamily)}`;
      ctx.fillStyle = style.subColor;
      drawTextWithStroke(line, cx, subStartY + i * (subSize * 1.4), style.subStrokeColor, style.subStrokeWidth);
    });
    y += subLines.length * (subSize * 1.4) + subSize * 1.0;
  }

  // CTA
  if (style.showCta && copy.cta) {
    const ctaSize = style.ctaFontSize;
    ctx.font = `bold ${ctaSize}px ${cssFontFamily(style.ctaFontFamily)}`;
    const ctaMetrics = ctx.measureText(copy.cta);
    const ctaPadX = ctaSize * 1.2;
    const ctaPadY = ctaSize * 0.6;
    const ctaW = ctaMetrics.width + ctaPadX * 2;
    const ctaH = ctaSize + ctaPadY * 2;
    const ctaX = cx - ctaW / 2;
    const ctaBaseY = y + h * (style.ctaOffsetY / 100);
    const ctaY = ctaBaseY - ctaH / 2;

    if (style.ctaShape !== "none") {
      ctx.fillStyle = style.ctaBgColor;
      ctx.beginPath();

      if (style.ctaShape === "pill") {
        const r = ctaH / 2;
        ctx.moveTo(ctaX + r, ctaY);
        ctx.lineTo(ctaX + ctaW - r, ctaY);
        ctx.arcTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaH, r);
        ctx.lineTo(ctaX + ctaW, ctaY + ctaH - r);
        ctx.arcTo(ctaX + ctaW, ctaY + ctaH, ctaX, ctaY + ctaH, r);
        ctx.lineTo(ctaX + r, ctaY + ctaH);
        ctx.arcTo(ctaX, ctaY + ctaH, ctaX, ctaY, r);
        ctx.lineTo(ctaX, ctaY + r);
        ctx.arcTo(ctaX, ctaY, ctaX + ctaW, ctaY, r);
      } else {
        // rect
        const r = Math.min(style.ctaCornerRadius, ctaH / 2);
        ctx.moveTo(ctaX + r, ctaY);
        ctx.lineTo(ctaX + ctaW - r, ctaY);
        ctx.arcTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaH, r);
        ctx.lineTo(ctaX + ctaW, ctaY + ctaH - r);
        ctx.arcTo(ctaX + ctaW, ctaY + ctaH, ctaX, ctaY + ctaH, r);
        ctx.lineTo(ctaX + r, ctaY + ctaH);
        ctx.arcTo(ctaX, ctaY + ctaH, ctaX, ctaY, r);
        ctx.lineTo(ctaX, ctaY + r);
        ctx.arcTo(ctaX, ctaY, ctaX + ctaW, ctaY, r);
      }

      ctx.closePath();
      ctx.fill();

      if (style.ctaBorderWidth > 0) {
        ctx.strokeStyle = style.ctaBorderColor;
        ctx.lineWidth = style.ctaBorderWidth;
        ctx.stroke();
      }
    }

    ctx.fillStyle = style.ctaColor;
    ctx.font = `bold ${ctaSize}px ${cssFontFamily(style.ctaFontFamily)}`;
    drawTextWithStroke(copy.cta, cx, ctaBaseY, style.ctaTextStrokeColor, style.ctaTextStrokeWidth);
  }
}

// ─────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{children}</div>;
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-[11px] font-black text-zinc-700 uppercase tracking-wider whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-zinc-100" />
    </div>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-7 rounded-md border border-zinc-300 overflow-hidden shrink-0 cursor-pointer" style={{ backgroundColor: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </div>
      <input
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-xs font-mono text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  );
}

function SliderInput({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (v: number) => void; label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[9px] text-zinc-400 font-bold shrink-0 w-10">{label}</span>}
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="flex-1 accent-indigo-500"
      />
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, +e.target.value || min)))}
        className="w-12 shrink-0 bg-white border border-zinc-300 rounded-lg px-1 py-1 text-xs font-mono text-zinc-900 text-right outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  );
}

function StrokeRow({ color, width, onColorChange, onWidthChange }: {
  color: string; width: number;
  onColorChange: (v: string) => void; onWidthChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>텍스트 테두리</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ColorSwatch value={color} onChange={onColorChange} />
        </div>
        <input
          type="number" min={0} max={20} value={width}
          onChange={(e) => onWidthChange(Math.min(20, Math.max(0, +e.target.value || 0)))}
          className="w-12 shrink-0 bg-white border border-zinc-300 rounded-lg px-1 py-1 text-xs font-mono text-zinc-900 text-right outline-none focus:ring-1 focus:ring-indigo-400"
          placeholder="두께"
        />
      </div>
    </div>
  );
}

function FontSelect({ value, onChange, allFonts }: {
  value: string; onChange: (v: string) => void; allFonts: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const filtered = allFonts.filter((f) => f.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 outline-none hover:border-indigo-400 transition-all"
        style={{ fontFamily: value }}
      >
        <span className="truncate">{BUILTIN_FONT_LABELS[value] || value}</span>
        <span className="text-zinc-400 ml-1 shrink-0">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
            <Search className="size-3 text-zinc-400 shrink-0" />
            <input
              autoFocus type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="폰트 검색..."
              className="flex-1 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 bg-transparent"
            />
            {search && <button onClick={() => setSearch("")}><X className="size-3 text-zinc-400" /></button>}
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0
              ? <div className="px-3 py-3 text-xs text-zinc-400 text-center">검색 결과 없음</div>
              : filtered.map((f) => (
                <button key={f} type="button"
                  onClick={() => { onChange(f); setOpen(false); setSearch(""); }}
                  className={cn("w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors",
                    f === value ? "bg-indigo-50 text-indigo-600 font-bold" : "text-zinc-800")}
                  style={{ fontFamily: f }}
                >
                  {BUILTIN_FONT_LABELS[f] || f}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function Step2Style() {
  const { selectedCopy, updateSelectedCopy, style, setStyle, canvasW, setCanvasW, canvasH, setCanvasH, setStep, setExportDataUrl } = useWizard();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fontUploadRef = useRef<HTMLInputElement>(null);

  const [allFonts, setAllFonts] = useState<string[]>(BUILTIN_FONTS);
  const [loadingFonts, setLoadingFonts] = useState(false);

  const s = style;
  const update = useCallback(
    <K extends keyof StyleSettings>(key: K, val: StyleSettings[K]) =>
      setStyle((prev) => ({ ...prev, [key]: val })),
    [setStyle]
  );

  const addFontToList = useCallback((name: string) => {
    setAllFonts((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  // Redraw preview
  useEffect(() => {
    if (!previewRef.current || !selectedCopy) return;
    const canvas = previewRef.current;
    const copy = selectedCopy;

    const render = () => {
      const maxPx = 420;
      const scale = canvasW >= canvasH ? maxPx / canvasW : maxPx / canvasH;
      const pw = Math.round(canvasW * scale);
      const ph = Math.round(canvasH * scale);
      const ps: StyleSettings = {
        ...style,
        mainFontSize: Math.round(style.mainFontSize * scale),
        subFontSize: Math.round(style.subFontSize * scale),
        ctaFontSize: Math.round(style.ctaFontSize * scale),
        mainStrokeWidth: style.mainStrokeWidth * scale,
        subStrokeWidth: style.subStrokeWidth * scale,
        ctaTextStrokeWidth: style.ctaTextStrokeWidth * scale,
        ctaBorderWidth: style.ctaBorderWidth * scale,
        ctaCornerRadius: Math.round(style.ctaCornerRadius * scale),
      };
      drawCanvas(canvas, copy, ps, pw, ph);
    };

    // 폰트가 이미 로드됐으면 즉시, 아니면 ready 후 렌더
    if (document.fonts.status === "loaded") {
      render();
    } else {
      document.fonts.ready.then(render);
    }
  }, [style, selectedCopy, canvasW, canvasH]);

  const loadSystemFonts = async () => {
    if (!("queryLocalFonts" in window)) {
      alert("최신 Chrome/Edge를 사용해 주세요.");
      return;
    }
    setLoadingFonts(true);
    try {
      // @ts-ignore
      const localFonts: any[] = await window.queryLocalFonts();
      let added = 0;
      const seen = new Set<string>();
      for (const font of localFonts) {
        const name: string = font.fullName || font.family;
        if (seen.has(name)) continue;
        seen.add(name);
        try {
          const blob: Blob = await font.blob();
          const ab = await blob.arrayBuffer();
          const face = new FontFace(name, ab);
          await face.load();
          document.fonts.add(face);
          addFontToList(name);
          added++;
        } catch {
          addFontToList(name);
        }
      }
      alert(`${added}개 폰트를 로드했습니다.`);
    } catch {
      alert("시스템 폰트 접근 권한을 허용해 주세요.");
    } finally {
      setLoadingFonts(false);
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = file.name.replace(/\.[^.]+$/, "");
    const ab = await file.arrayBuffer();
    try {
      const face = new FontFace(fontName, ab);
      await face.load();
      document.fonts.add(face);
      addFontToList(fontName);
    } catch { /* ignore */ }
    if (fontUploadRef.current) fontUploadRef.current.value = "";
  };

  const handleNext = () => {
    if (!selectedCopy) return;
    const exportCanvas = document.createElement("canvas");
    drawCanvas(exportCanvas, selectedCopy, style, canvasW, canvasH);
    setExportDataUrl(exportCanvas.toDataURL("image/png"));
    setStep(3);
  };

  return (
    <div className="flex w-full h-full">

      {/* ── 좌측 컨트롤 패널 (자체 스크롤) ── */}
      <div className="w-96 shrink-0 h-full overflow-y-auto border-r border-zinc-100 bg-white">
        <div className="px-4 py-5 space-y-4">

          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">Step 2</div>
            <h2 className="text-lg font-black text-zinc-900">스타일 설정</h2>
          </div>

          {/* ── 캔버스 크기 ── */}
          <div className="rounded-2xl bg-zinc-50 p-3 space-y-2">
            <SectionDivider title="캔버스 크기" />
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {[
                { label: "1:1 · 1080×1080", w: 1080, h: 1080 },
                { label: "4:5 · 1080×1350", w: 1080, h: 1350 },
                { label: "9:16 · 1080×1920", w: 1080, h: 1920 },
                { label: "16:9 · 1920×1080", w: 1920, h: 1080 },
              ].map((r) => (
                <button key={r.label}
                  onClick={() => { setCanvasW(r.w); setCanvasH(r.h); }}
                  className={cn("py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-left",
                    canvasW === r.w && canvasH === r.h ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-600 bg-white")}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-0.5">
                <div className="text-[9px] text-zinc-400 font-bold">너비</div>
                <input type="number" max={5000} value={canvasW === 0 ? "" : canvasW}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setCanvasW(0); return; }
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setCanvasW(n);
                  }}
                  onBlur={() => setCanvasW(Math.max(100, canvasW || 100))}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <span className="text-zinc-400 mt-4">×</span>
              <div className="flex-1 space-y-0.5">
                <div className="text-[9px] text-zinc-400 font-bold">높이</div>
                <input type="number" max={5000} value={canvasH === 0 ? "" : canvasH}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setCanvasH(0); return; }
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setCanvasH(n);
                  }}
                  onBlur={() => setCanvasH(Math.max(100, canvasH || 100))}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* ── 배경색 ── */}
          <div className="rounded-2xl bg-amber-50 p-3 space-y-2">
            <SectionDivider title="배경색" />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {/* 투명 버튼 */}
              <button
                onClick={() => update("bgColor", "transparent")}
                title="투명"
                className={cn(
                  "size-6 rounded-md border transition-all overflow-hidden relative",
                  s.bgColor === "transparent" ? "ring-2 ring-indigo-500 ring-offset-1 border-indigo-300" : "border-zinc-300"
                )}
              >
                {/* 체커보드 패턴으로 투명 표시 */}
                <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full">
                  <rect width="8" height="8" fill="#ccc" />
                  <rect x="8" y="8" width="8" height="8" fill="#ccc" />
                  <rect x="8" y="0" width="8" height="8" fill="#fff" />
                  <rect x="0" y="8" width="8" height="8" fill="#fff" />
                </svg>
              </button>
              {BG_PRESETS.map((c) => (
                <button key={c} onClick={() => update("bgColor", c)} style={{ backgroundColor: c }}
                  className={cn("size-6 rounded-md border transition-all", s.bgColor === c ? "ring-2 ring-indigo-500 ring-offset-1" : "border-zinc-300")}
                />
              ))}
            </div>
            {s.bgColor !== "transparent" && (
              <ColorSwatch value={s.bgColor} onChange={(v) => update("bgColor", v)} />
            )}
            {s.bgColor === "transparent" && (
              <div className="text-[10px] text-zinc-500 font-bold px-1">
                투명 배경 — PNG 내보내기 시 알파 채널 유지
              </div>
            )}
          </div>

          {/* ── 폰트 불러오기 ── */}
          <div className="rounded-2xl bg-stone-50 p-3 space-y-2">
            <SectionDivider title="폰트 불러오기" />
            <div className="flex gap-2">
              <button onClick={loadSystemFonts} disabled={loadingFonts}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 transition-all"
              >
                <Monitor className="size-3.5" />
                {loadingFonts ? "로딩..." : "시스템 폰트"}
              </button>
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
                <Upload className="size-3.5" />
                파일 업로드
                <input ref={fontUploadRef} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} className="hidden" />
              </label>
            </div>
            <div className="text-[9px] text-zinc-400">{allFonts.length}개 폰트 사용 가능</div>
          </div>

          {/* ── 메인 카피 ── */}
          <div className="rounded-2xl bg-blue-50 p-3 space-y-2">
            <SectionDivider title="메인 카피" />
            <div className="space-y-2">
              <div>
                <Label>텍스트</Label>
                <textarea
                  value={selectedCopy?.mainHeadline ?? ""}
                  onChange={(e) => updateSelectedCopy({ mainHeadline: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
                />
              </div>
              <FontSelect value={s.mainFontFamily} onChange={(v) => update("mainFontFamily", v)} allFonts={allFonts} />
              <SliderInput value={s.mainFontSize} min={12} max={300} onChange={(v) => update("mainFontSize", v)} label="크기" />
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label>글자색</Label>
                  <ColorSwatch value={s.mainColor} onChange={(v) => update("mainColor", v)} />
                </div>
                <button
                  onClick={() => update("mainFontWeight", s.mainFontWeight === "bold" ? "normal" : "bold")}
                  className={cn("px-3 py-2 rounded-lg text-xs font-black border transition-all mt-4 shrink-0",
                    s.mainFontWeight === "bold" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-300 text-zinc-600")}
                >B</button>
              </div>
              <StrokeRow
                color={s.mainStrokeColor} width={s.mainStrokeWidth}
                onColorChange={(v) => update("mainStrokeColor", v)}
                onWidthChange={(v) => update("mainStrokeWidth", v)}
              />
              <div>
                <Label>세로 위치 (%)</Label>
                <SliderInput value={s.mainOffsetY} min={-50} max={50} onChange={(v) => update("mainOffsetY", v)} />
              </div>
            </div>
          </div>

          {/* ── 서브 카피 ── */}
          <div className="rounded-2xl bg-emerald-50 p-3 space-y-2">
            <SectionDivider title="서브 카피" />
            <div className="space-y-2">
              <div>
                <Label>텍스트</Label>
                <textarea
                  value={selectedCopy?.subHeadline ?? ""}
                  onChange={(e) => updateSelectedCopy({ subHeadline: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
                />
              </div>
              <FontSelect value={s.subFontFamily} onChange={(v) => update("subFontFamily", v)} allFonts={allFonts} />
              <SliderInput value={s.subFontSize} min={8} max={200} onChange={(v) => update("subFontSize", v)} label="크기" />
              <div>
                <Label>글자색</Label>
                <ColorSwatch value={s.subColor} onChange={(v) => update("subColor", v)} />
              </div>
              <StrokeRow
                color={s.subStrokeColor} width={s.subStrokeWidth}
                onColorChange={(v) => update("subStrokeColor", v)}
                onWidthChange={(v) => update("subStrokeWidth", v)}
              />
              <div>
                <Label>세로 위치 (%)</Label>
                <SliderInput value={s.subOffsetY} min={-50} max={50} onChange={(v) => update("subOffsetY", v)} />
              </div>
            </div>
          </div>

          {/* ── CTA 버튼 ── */}
          <div className="rounded-2xl bg-purple-50 p-3 space-y-2">
            <SectionDivider title="CTA 버튼" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">표시</span>
                <button onClick={() => update("showCta", !s.showCta)}
                  className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all",
                    s.showCta ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-400")}
                >{s.showCta ? "ON" : "OFF"}</button>
              </div>

              {s.showCta && (<>
                <div>
                  <Label>텍스트</Label>
                  <input
                    type="text"
                    value={selectedCopy?.cta ?? ""}
                    onChange={(e) => updateSelectedCopy({ cta: e.target.value })}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <FontSelect value={s.ctaFontFamily} onChange={(v) => update("ctaFontFamily", v)} allFonts={allFonts} />
                <SliderInput value={s.ctaFontSize} min={8} max={120} onChange={(v) => update("ctaFontSize", v)} label="크기" />

                <div>
                  <Label>글자색</Label>
                  <ColorSwatch value={s.ctaColor} onChange={(v) => update("ctaColor", v)} />
                </div>

                <StrokeRow
                  color={s.ctaTextStrokeColor} width={s.ctaTextStrokeWidth}
                  onColorChange={(v) => update("ctaTextStrokeColor", v)}
                  onWidthChange={(v) => update("ctaTextStrokeWidth", v)}
                />

                {/* 버튼 모양 */}
                <div>
                  <Label>버튼 모양</Label>
                  <div className="flex gap-1">
                    {(["pill", "rect", "none"] as const).map((shape) => (
                      <button key={shape}
                        onClick={() => update("ctaShape", shape)}
                        className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                          s.ctaShape === shape ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-500 bg-white")}
                      >
                        {shape === "pill" ? "알약형" : shape === "rect" ? "사각형" : "텍스트만"}
                      </button>
                    ))}
                  </div>
                </div>

                {s.ctaShape !== "none" && (<>
                  <div>
                    <Label>버튼 배경색</Label>
                    <ColorSwatch value={s.ctaBgColor} onChange={(v) => update("ctaBgColor", v)} />
                  </div>

                  {s.ctaShape === "rect" && (
                    <div>
                      <Label>모서리 둥글기</Label>
                      <SliderInput value={s.ctaCornerRadius} min={0} max={80} onChange={(v) => update("ctaCornerRadius", v)} />
                    </div>
                  )}

                  <div>
                    <Label>버튼 테두리</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ColorSwatch value={s.ctaBorderColor} onChange={(v) => update("ctaBorderColor", v)} />
                      </div>
                      <input
                        type="number" min={0} max={20} value={s.ctaBorderWidth}
                        onChange={(e) => update("ctaBorderWidth", Math.min(20, Math.max(0, +e.target.value || 0)))}
                        className="w-12 shrink-0 bg-white border border-zinc-300 rounded-lg px-1 py-1 text-xs font-mono text-zinc-900 text-right outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="두께"
                      />
                    </div>
                  </div>
                </>)}

                <div>
                  <Label>세로 위치 (%)</Label>
                  <SliderInput value={s.ctaOffsetY} min={-50} max={50} onChange={(v) => update("ctaOffsetY", v)} />
                </div>
              </>)}
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex gap-2 pt-2 pb-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-zinc-300 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">
              <ChevronLeft className="size-4" /> 이전
            </button>
            <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.98]">
              내보내기 <ChevronRight className="size-4" />
            </button>
          </div>

        </div>
      </div>

      {/* ── 우측 미리보기 (고정) ── */}
      <div className="flex-1 flex items-center justify-center bg-zinc-100 overflow-hidden">
        <div className="shadow-2xl rounded-xl overflow-hidden"
          style={style.bgColor === "transparent" ? {
            backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)",
            backgroundSize: "16px 16px",
          } : undefined}
        >
          <canvas ref={previewRef} style={{ display: "block" }} />
        </div>
      </div>

    </div>
  );
}
