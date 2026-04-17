"use client";

import { useEffect, useState, useRef } from "react";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Trash2, Settings2,
  ChevronDown, Upload, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Type, Search, X as XIcon,
  ChevronsUp, ChevronsDown, ChevronUp, ChevronDown as ChevronDownIcon,
  RotateCw, FlipHorizontal, FlipVertical, Lock, Unlock, Strikethrough
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import { Shadow, Gradient } from "fabric";
import * as opentype from "opentype.js";

const BLEND_MODES = [
  { value: "source-over", label: "기본 (Normal)" },
  { value: "multiply", label: "곱하기 (Multiply)" },
  { value: "screen", label: "스크린 (Screen)" },
  { value: "overlay", label: "오버레이 (Overlay)" },
  { value: "darken", label: "어둡게 (Darken)" },
  { value: "lighten", label: "밝게 (Lighten)" },
  { value: "color-dodge", label: "색상 닷지 (Color Dodge)" },
  { value: "color-burn", label: "색상 번 (Color Burn)" },
  { value: "hard-light", label: "하드 라이트 (Hard Light)" },
  { value: "soft-light", label: "소프트 라이트 (Soft Light)" },
  { value: "difference", label: "차이 (Difference)" },
  { value: "exclusion", label: "제외 (Exclusion)" },
  { value: "hue", label: "색조 (Hue)" },
  { value: "saturation", label: "채도 (Saturation)" },
  { value: "color", label: "색상 (Color)" },
  { value: "luminosity", label: "광도 (Luminosity)" },
];

export default function Properties() {
  const {
    selectedObject, canvas, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight,
    saveHistory, customFonts, addCustomFont, alignObject, loadSystemFonts, setArtboardColor
  } = useEditor();

  // Text
  const [fontSize, setFontSize] = useState<number>(32);
  const [fill, setFill] = useState<string>("#000000");
  const [opacity, setOpacity] = useState<number>(1);
  const [textAlign, setTextAlign] = useState<string>("left");
  const [fontWeight, setFontWeight] = useState<string>("normal");
  const [fontFamily, setFontFamily] = useState<string>("Pretendard");
  const [fontStyle, setFontStyle] = useState<string>("normal");
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLinethrough, setIsLinethrough] = useState(false);
  const [lineHeight, setLineHeight] = useState<number>(1.16);
  const [charSpacing, setCharSpacing] = useState<number>(0);

  // Appearance
  const [stroke, setStroke] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [shadowBlur, setShadowBlur] = useState<number>(0);
  const [shadowColor, setShadowColor] = useState<string>("#000000");
  const [shadowOffsetX, setShadowOffsetX] = useState<number>(0);
  const [shadowOffsetY, setShadowOffsetY] = useState<number>(0);

  // Transform
  const [angle, setAngle] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState(true);

  // Blend
  const [blendMode, setBlendMode] = useState<string>("source-over");

  // Shape
  const [cornerRadius, setCornerRadius] = useState<number>(0);

  // Canvas
  const [localWidth, setLocalWidth] = useState<string>("");
  const [localHeight, setLocalHeight] = useState<string>("");
  const [localX, setLocalX] = useState<string>("");
  const [localY, setLocalY] = useState<string>("");
  const [artboardBg, setArtboardBg] = useState<string>("#ffffff");

  // Font search
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [fontSearchQuery, setFontSearchQuery] = useState<string>("");
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const fontSearchInputRef = useRef<HTMLInputElement>(null);

  const filteredFonts = customFonts.filter(f =>
    f.name.toLowerCase().includes(fontSearchQuery.toLowerCase())
  );

  const isText = selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text" || selectedObject.type === "textbox");
  const isRect = selectedObject?.type === "rect" && !(selectedObject as any).isArtboard;

  // Computed dimensions (rendered size including scale)
  const actualWidth = selectedObject ? Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)) : 0;
  const actualHeight = selectedObject ? Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)) : 0;

  // Close font dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state from selected object
  useEffect(() => {
    if (!selectedObject) return;
    const obj = selectedObject as any;
    const rawFill = obj.fill;
    const fillValue = typeof rawFill === "string" ? rawFill : "gradient";

    if (isText) {
      setFontSize(obj.fontSize || 32);
      setFill(typeof obj.fill === "string" ? obj.fill : "#000000");
      setTextAlign(obj.textAlign || "left");
      setFontWeight(obj.fontWeight || "normal");
      setFontFamily(obj.fontFamily || "Pretendard");
      setFontStyle(obj.fontStyle || "normal");
      setIsUnderline(!!obj.underline);
      setIsLinethrough(!!obj.linethrough);
      setLineHeight(obj.lineHeight ?? 1.16);
      setCharSpacing(obj.charSpacing ?? 0);
    } else {
      setFill(fillValue);
    }

    setOpacity(selectedObject.opacity ?? 1);
    setAngle(Math.round(selectedObject.angle || 0));
    setBlendMode(obj.globalCompositeOperation || "source-over");
    setLocalX(Math.round(selectedObject.left || 0).toString());
    setLocalY(Math.round(selectedObject.top || 0).toString());
    setStroke(obj.stroke || "transparent");
    setStrokeWidth(obj.strokeWidth || 0);

    if (selectedObject.type === "rect") {
      setCornerRadius(obj.rx || 0);
    }

    if (selectedObject.shadow instanceof Shadow) {
      const s = selectedObject.shadow as Shadow;
      setShadowBlur(s.blur || 0);
      setShadowColor(s.color || "#000000");
      setShadowOffsetX(s.offsetX || 0);
      setShadowOffsetY(s.offsetY || 0);
    } else {
      setShadowBlur(0);
      setShadowOffsetX(0);
      setShadowOffsetY(0);
    }
  }, [selectedObject, isText]);

  useEffect(() => {
    setLocalWidth(canvasWidth.toString());
    setLocalHeight(canvasHeight.toString());
  }, [canvasWidth, canvasHeight]);

  // --- Helpers ---

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;

    // Compound shadow properties
    if (key === "shadow") {
      selectedObject.set("shadow", new Shadow({ color: shadowColor, blur: value, offsetX: shadowOffsetX, offsetY: shadowOffsetY }));
      setShadowBlur(value);
    } else if (key === "shadowColor") {
      selectedObject.set("shadow", new Shadow({ color: value, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY }));
      setShadowColor(value);
    } else if (key === "shadowOffsetX") {
      selectedObject.set("shadow", new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: value, offsetY: shadowOffsetY }));
      setShadowOffsetX(value);
    } else if (key === "shadowOffsetY") {
      selectedObject.set("shadow", new Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: value }));
      setShadowOffsetY(value);
    } else {
      // Binary font injection for system fonts
      if (key === "fontFamily") {
        setFontFamily(value);
        const font = customFonts.find(f => f.family === value);
        if (font && font.postscriptName && "queryLocalFonts" in window) {
          const injectBinaryFont = async () => {
            try {
              // @ts-ignore
              const localFonts = await window.queryLocalFonts();
              const target = localFonts.find((f: any) => f.postscriptName === font.postscriptName);
              if (target) {
                const blob = await target.blob();
                const buffer = await blob.arrayBuffer();
                const fontFace = new FontFace(font.family, buffer);
                const loaded = await fontFace.load();
                document.fonts.add(loaded);
                if (selectedObject && canvas) {
                  selectedObject.set("fontFamily", value);
                  selectedObject.set("dirty", true);
                  canvas.requestRenderAll();
                  saveHistory();
                }
              }
            } catch (e) {
              console.error("Binary Font Load Fallback:", e);
              if (selectedObject && canvas) {
                selectedObject.set("fontFamily", value);
                selectedObject.set("dirty", true);
                canvas.requestRenderAll();
                saveHistory();
              }
            }
          };
          injectBinaryFont();
          return;
        }
      }

      selectedObject.set(key as any, value);
      if (key === "fontSize") setFontSize(value);
      if (key === "fill") setFill(value);
      if (key === "opacity") setOpacity(value);
      if (key === "textAlign") setTextAlign(value);
      if (key === "fontWeight") setFontWeight(value);
      if (key === "fontFamily") setFontFamily(value);
      if (key === "fontStyle") setFontStyle(value);
      if (key === "underline") setIsUnderline(value);
      if (key === "linethrough") setIsLinethrough(value);
      if (key === "lineHeight") setLineHeight(value);
      if (key === "charSpacing") setCharSpacing(value);
      if (key === "globalCompositeOperation") setBlendMode(value);
      if (key === "angle") { setAngle(value); selectedObject.setCoords(); }
      if (key === "stroke") setStroke(value);
      if (key === "strokeWidth") setStrokeWidth(value);
      canvas.renderAll();
      saveHistory();
      return;
    }
    canvas.renderAll();
  };

  const handleDimensionChange = (dim: "width" | "height", value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || !selectedObject || !canvas) return;
    const objW = selectedObject.width || 1;
    const objH = selectedObject.height || 1;
    if (dim === "width") {
      const newSx = num / objW;
      if (lockRatio) {
        const ratio = (selectedObject.scaleY || 1) / (selectedObject.scaleX || 1);
        selectedObject.set({ scaleX: newSx, scaleY: newSx * ratio });
      } else {
        selectedObject.set({ scaleX: newSx });
      }
    } else {
      const newSy = num / objH;
      if (lockRatio) {
        const ratio = (selectedObject.scaleX || 1) / (selectedObject.scaleY || 1);
        selectedObject.set({ scaleY: newSy, scaleX: newSy * ratio });
      } else {
        selectedObject.set({ scaleY: newSy });
      }
    }
    selectedObject.setCoords();
    canvas.renderAll();
    saveHistory();
  };

  const handleFlip = (axis: "flipX" | "flipY") => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(axis, !(selectedObject as any)[axis]);
    canvas.renderAll();
    saveHistory();
  };

  const applyGradient = (colors: string[]) => {
    if (!selectedObject || !canvas) return;
    const gradient = new Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: selectedObject.width || 100, y2: selectedObject.height || 100 },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] },
      ],
    });
    selectedObject.set("fill", gradient);
    setFill("gradient");
    canvas.requestRenderAll();
    saveHistory();
  };

  const deleteObject = () => {
    if (!selectedObject || !canvas || (selectedObject as any).isArtboard) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    saveHistory();
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const defaultName = file.name.split(".")[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fontData = event.target?.result as ArrayBuffer;
      let fontName = defaultName;
      try {
        const parsedFont = opentype.parse(fontData);
        const names = parsedFont.names;
        const fontFam = names?.fontFamily;
        const fullNm = names?.fullName;
        fontName =
          (fontFam && fontFam.ko) ||
          (fullNm && fullNm.ko) ||
          (fontFam && fontFam.en) ||
          (fullNm && fullNm.en) ||
          defaultName;
      } catch (err) {
        console.warn("Failed to parse font metadata, using filename as fallback.", err);
      }
      const font = new FontFace(fontName, fontData);
      try {
        await font.load();
        document.fonts.add(font);
        addCustomFont(fontName, fontName);
        updateProperty("fontFamily", fontName);
      } catch (err) {
        console.error(err);
        alert("폰트 렌더링에 실패했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fontInputRef.current) fontInputRef.current.value = "";
  };

  // ===== No selection: Canvas settings panel =====
  if (!selectedObject) {
    const ratios = [
      { name: "1:1 정방형", w: 1080, h: 1080, icon: "w-4 h-4" },
      { name: "9:16 피드", w: 1080, h: 1920, icon: "w-3 h-5.5" },
      { name: "16:9 가로", w: 1920, h: 1080, icon: "w-5.5 h-3" },
      { name: "4:5 인스타", w: 1080, h: 1350, icon: "w-4 h-5" },
    ];
    return (
      <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4"><Settings2 className="size-4" /> <h3 className="text-sm font-black uppercase tracking-tight">캔버스 설정</h3></div>

        {/* System Font Access */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">시스템 폰트 연동</label>
          <button
            onClick={() => loadSystemFonts()}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <Type className="size-4 text-zinc-400 group-hover:text-indigo-600" />
            <span className="text-xs font-bold text-zinc-600 group-hover:text-indigo-700">내 PC 폰트 불러오기</span>
          </button>
          <p className="text-[9px] text-zinc-400 leading-relaxed px-1">PC에 설치된 폰트를 별도 업로드 없이 에디터에서 바로 사용합니다. (권한 허용 필요)</p>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">기본 설정</label>
          <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">배경 색상</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-200 shadow-sm cursor-pointer">
              <input type="color" value={artboardBg} onChange={(e) => { setArtboardBg(e.target.value); setArtboardColor(e.target.value); }} className="absolute -inset-2 w-16 h-16 cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 font-bold uppercase">W (가로)</span>
              <input type="number" value={localWidth} onChange={(e) => { setLocalWidth(e.target.value); const v=parseInt(e.target.value); if(!isNaN(v)) setCanvasWidth(v); }} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
            </div>
            <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 font-bold uppercase">H (세로)</span>
              <input type="number" value={localHeight} onChange={(e) => { setLocalHeight(e.target.value); const v=parseInt(e.target.value); if(!isNaN(v)) setCanvasHeight(v); }} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">폰트 자산 추가</label>
            <button onClick={() => fontInputRef.current?.click()} className="p-1 px-2 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 transition-colors">파일 업로드 (.ttf, .otf)</button>
            <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" />
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed px-1">작업 중 사용할 개별 폰트 파일을 일시적으로 추가합니다.</p>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">비율 프리셋</label>
          <div className="flex flex-col gap-2">
            {ratios.map((r) => (
              <button key={r.name} onClick={() => { setCanvasWidth(r.w); setCanvasHeight(r.h); }} className={cn("flex items-center gap-4 p-3 rounded-xl border-2 transition-all", canvasWidth === r.w && canvasHeight === r.h ? "border-indigo-500 bg-indigo-50/50" : "border-zinc-100 hover:border-zinc-200")}>
                <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200"><div className={cn("bg-zinc-300 rounded-sm shadow-inner", r.icon)} /></div>
                <div className="flex flex-col text-left"><span className="text-xs font-bold">{r.name}</span><span className="text-[10px] font-mono text-zinc-400">{r.w}x{r.h}</span></div>
              </button>
            ))}
          </div>
        </section>
      </aside>
    );
  }

  // ===== Selected object panel =====
  const inputCls = "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono";
  const toggleBtnCls = (active: boolean) => cn("p-2 rounded-lg transition-all flex items-center justify-center", active ? "bg-white dark:bg-zinc-800 shadow-sm text-indigo-600" : "hover:bg-white dark:hover:bg-zinc-800 text-zinc-500");

  return (
    <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h3 className="text-sm font-black uppercase tracking-tight">{isText ? "텍스트" : "객체"} 설정</h3>
        <button onClick={deleteObject} className="p-2 text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="size-4" /></button>
      </div>

      <div className="flex flex-col gap-6">

        {/* ========== TRANSFORM ========== */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">변환 (Transform)</label>
          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold">X</span>
              <input type="number" value={localX} onChange={(e) => { setLocalX(e.target.value); const v=parseFloat(e.target.value); if(!isNaN(v)&&selectedObject&&canvas){selectedObject.set("left",v);selectedObject.setCoords();canvas.renderAll();saveHistory();} }} className={inputCls} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold">Y</span>
              <input type="number" value={localY} onChange={(e) => { setLocalY(e.target.value); const v=parseFloat(e.target.value); if(!isNaN(v)&&selectedObject&&canvas){selectedObject.set("top",v);selectedObject.setCoords();canvas.renderAll();saveHistory();} }} className={inputCls} />
            </div>
          </div>
          {/* Dimensions */}
          <div className="grid grid-cols-[1fr_24px_1fr] gap-1 items-end">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold">W</span>
              <input type="number" value={actualWidth} onChange={(e) => handleDimensionChange("width", e.target.value)} className={inputCls} />
            </div>
            <button onClick={() => setLockRatio(!lockRatio)} className={cn("p-0.5 rounded transition-colors mb-1 flex items-center justify-center", lockRatio ? "text-indigo-500" : "text-zinc-300 hover:text-zinc-400")}>
              {lockRatio ? <Lock className="size-3" /> : <Unlock className="size-3" />}
            </button>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold">H</span>
              <input type="number" value={actualHeight} onChange={(e) => handleDimensionChange("height", e.target.value)} className={inputCls} />
            </div>
          </div>
          {/* Rotation */}
          <div className="flex items-center gap-2">
            <RotateCw className="size-3 text-zinc-400 shrink-0" />
            <input type="number" value={angle} onChange={(e) => { const v=parseFloat(e.target.value); setAngle(isNaN(v)?0:v); if(!isNaN(v)&&selectedObject&&canvas){selectedObject.set("angle",v);selectedObject.setCoords();canvas.renderAll();saveHistory();} }} className={cn(inputCls, "flex-1")} />
            <span className="text-[10px] text-zinc-400 font-bold shrink-0">°</span>
          </div>
          {/* Flip */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleFlip("flipX")} className={cn("flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-bold transition-all", (selectedObject as any)?.flipX ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500")}>
              <FlipHorizontal className="size-3" /> 좌우 반전
            </button>
            <button onClick={() => handleFlip("flipY")} className={cn("flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-bold transition-all", (selectedObject as any)?.flipY ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-500")}>
              <FlipVertical className="size-3" /> 상하 반전
            </button>
          </div>
        </section>

        {/* ========== ALIGNMENT ========== */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">정렬 (Artboard 기준)</label>
          <div className="grid grid-cols-6 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200">
            <button onClick={() => alignObject("top")} title="맨 위 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignStartHorizontal className="size-4" /></button>
            <button onClick={() => alignObject("middle")} title="상하 중앙 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignCenterHorizontal className="size-4" /></button>
            <button onClick={() => alignObject("bottom")} title="맨 아래 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignEndHorizontal className="size-4" /></button>
            <button onClick={() => alignObject("left")} title="왼쪽 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignStartVertical className="size-4" /></button>
            <button onClick={() => alignObject("center")} title="좌우 중앙 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignCenterVertical className="size-4" /></button>
            <button onClick={() => alignObject("right")} title="오른쪽 정렬" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignEndVertical className="size-4" /></button>
          </div>
        </section>

        {/* ========== LAYER ORDER ========== */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">레이어 순서</label>
          <div className="grid grid-cols-4 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200">
            <button title="맨 앞으로 (Shift+])" onClick={() => { if (!canvas || !selectedObject) return; canvas.bringObjectToFront(selectedObject); canvas.renderAll(); saveHistory(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all">
              <ChevronsUp className="size-4" /><span className="text-[9px] font-bold text-zinc-400">맨 앞</span>
            </button>
            <button title="앞으로 (])" onClick={() => { if (!canvas || !selectedObject) return; canvas.bringObjectForward(selectedObject); canvas.renderAll(); saveHistory(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all">
              <ChevronUp className="size-4" /><span className="text-[9px] font-bold text-zinc-400">앞으로</span>
            </button>
            <button title="뒤로 ([)" onClick={() => { if (!canvas || !selectedObject) return; canvas.sendObjectBackwards(selectedObject); const ab=canvas.getObjects().find((o:any)=>o.isArtboard); if(ab) canvas.sendObjectToBack(ab); canvas.renderAll(); saveHistory(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all">
              <ChevronDownIcon className="size-4" /><span className="text-[9px] font-bold text-zinc-400">뒤로</span>
            </button>
            <button title="맨 뒤로 (Shift+[)" onClick={() => { if (!canvas || !selectedObject) return; canvas.sendObjectToBack(selectedObject); const ab=canvas.getObjects().find((o:any)=>o.isArtboard); if(ab) canvas.sendObjectToBack(ab); canvas.renderAll(); saveHistory(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all">
              <ChevronsDown className="size-4" /><span className="text-[9px] font-bold text-zinc-400">맨 뒤</span>
            </button>
          </div>
        </section>

        {/* ========== BLEND MODE ========== */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">블렌드 모드</label>
          <select
            value={blendMode}
            onChange={(e) => updateProperty("globalCompositeOperation", e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {BLEND_MODES.map((bm) => (
              <option key={bm.value} value={bm.value}>{bm.label}</option>
            ))}
          </select>
        </section>

        {/* ========== TYPOGRAPHY (text only) ========== */}
        {isText && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">타이포그래피</label>
              <button onClick={() => fontInputRef.current?.click()} className="flex items-center gap-1 text-[10px] font-bold text-indigo-500"><Upload className="size-3" /> 업로드</button>
              <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.otf,.woff" />
            </div>

            {/* Font Searchable Dropdown */}
            <div ref={fontDropdownRef} className="relative">
              <button
                onClick={() => { setIsFontDropdownOpen(prev => !prev); setTimeout(() => fontSearchInputRef.current?.focus(), 50); }}
                className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold outline-none hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <span className="truncate" style={{ fontFamily }}>{fontFamily || "폰트 선택"}</span>
                <ChevronDown className={cn("size-3 shrink-0 ml-2 text-zinc-400 transition-transform", isFontDropdownOpen && "rotate-180")} />
              </button>
              {isFontDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <Search className="size-3 text-zinc-400 shrink-0" />
                    <input ref={fontSearchInputRef} type="text" value={fontSearchQuery} onChange={(e) => setFontSearchQuery(e.target.value)} placeholder="폰트 검색..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400" />
                    {fontSearchQuery && (<button onClick={() => setFontSearchQuery("")} className="shrink-0 text-zinc-400 hover:text-zinc-600"><XIcon className="size-3" /></button>)}
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredFonts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[10px] text-zinc-400">검색 결과 없음</div>
                    ) : filteredFonts.map((f) => (
                      <button key={f.name} onClick={() => { updateProperty("fontFamily", f.family); setFontSearchQuery(""); setIsFontDropdownOpen(false); }}
                        className={cn("w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors truncate", fontFamily === f.family && "bg-indigo-50 dark:bg-zinc-800 text-indigo-600 font-bold")}
                        style={{ fontFamily: f.family }}>{f.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">Size</span><span className="text-[10px] font-mono text-indigo-500">{fontSize}px</span></div>
              <input type="range" min="8" max="250" value={fontSize} onChange={(e) => updateProperty("fontSize", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>

            {/* Text Style Toggles: B I U S */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200">
              <button onClick={() => updateProperty("fontWeight", fontWeight === "bold" ? "normal" : "bold")} title="굵게 (Ctrl+B)" className={toggleBtnCls(fontWeight === "bold")}><Bold className="size-4" /></button>
              <button onClick={() => updateProperty("fontStyle", fontStyle === "italic" ? "normal" : "italic")} title="기울임 (Ctrl+I)" className={toggleBtnCls(fontStyle === "italic")}><Italic className="size-4" /></button>
              <button onClick={() => updateProperty("underline", !isUnderline)} title="밑줄 (Ctrl+U)" className={toggleBtnCls(isUnderline)}><Underline className="size-4" /></button>
              <button onClick={() => updateProperty("linethrough", !isLinethrough)} title="취소선" className={toggleBtnCls(isLinethrough)}><Strikethrough className="size-4" /></button>
            </div>

            {/* Text Alignment */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200">
              <button onClick={() => updateProperty("textAlign", "left")} title="왼쪽 정렬" className={toggleBtnCls(textAlign === "left")}><AlignLeft className="size-4" /></button>
              <button onClick={() => updateProperty("textAlign", "center")} title="가운데 정렬" className={toggleBtnCls(textAlign === "center")}><AlignCenter className="size-4" /></button>
              <button onClick={() => updateProperty("textAlign", "right")} title="오른쪽 정렬" className={toggleBtnCls(textAlign === "right")}><AlignRight className="size-4" /></button>
              <button onClick={() => updateProperty("textAlign", "justify")} title="양쪽 정렬" className={toggleBtnCls(textAlign === "justify")}><AlignJustify className="size-4" /></button>
            </div>

            {/* Line Height (Leading) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">행간 (Leading)</span><span className="text-[10px] font-mono text-indigo-500">{lineHeight.toFixed(2)}</span></div>
              <input type="range" min="0.5" max="3" step="0.05" value={lineHeight} onChange={(e) => updateProperty("lineHeight", parseFloat(e.target.value))} className="w-full accent-indigo-600" />
            </div>

            {/* Letter Spacing (Tracking) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">자간 (Tracking)</span><span className="text-[10px] font-mono text-indigo-500">{charSpacing}</span></div>
              <input type="range" min="-200" max="800" step="10" value={charSpacing} onChange={(e) => updateProperty("charSpacing", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
          </section>
        )}

        {/* ========== CORNER RADIUS (rect only) ========== */}
        {isRect && (
          <section className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">모서리 둥글기</label>
            <div className="space-y-1">
              <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">Radius</span><span className="text-[10px] font-mono text-indigo-500">{cornerRadius}px</span></div>
              <input type="range" min="0" max="200" value={cornerRadius} onChange={(e) => {
                const v = parseInt(e.target.value);
                if (selectedObject && canvas) {
                  (selectedObject as any).set({ rx: v, ry: v });
                  setCornerRadius(v);
                  canvas.renderAll();
                  saveHistory();
                }
              }} className="w-full accent-indigo-600" />
            </div>
          </section>
        )}

        {/* ========== BORDER & SHADOW ========== */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">테두리 및 그림자</label>
          <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 border-dashed">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">테두리 색상</span>
              <input type="color" value={stroke === "transparent" ? "#000000" : stroke} onChange={(e) => updateProperty("stroke", e.target.value)} className="size-6 rounded-full border-2 border-white shadow-sm cursor-pointer" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-zinc-400">두께</span><span className="text-[10px] font-mono">{strokeWidth}px</span></div>
              <input type="range" min="0" max="50" value={strokeWidth} onChange={(e) => updateProperty("strokeWidth", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">그림자 색상</span>
              <input type="color" value={shadowColor} onChange={(e) => updateProperty("shadowColor", e.target.value)} className="size-6 rounded-full border-2 border-white shadow-sm cursor-pointer" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-zinc-400">블러</span><span className="text-[10px] font-mono">{shadowBlur}px</span></div>
              <input type="range" min="0" max="100" value={shadowBlur} onChange={(e) => updateProperty("shadow", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-zinc-400">X 오프셋</span><span className="text-[10px] font-mono">{shadowOffsetX}px</span></div>
              <input type="range" min="-50" max="50" value={shadowOffsetX} onChange={(e) => updateProperty("shadowOffsetX", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-[10px] text-zinc-400">Y 오프셋</span><span className="text-[10px] font-mono">{shadowOffsetY}px</span></div>
              <input type="range" min="-50" max="50" value={shadowOffsetY} onChange={(e) => updateProperty("shadowOffsetY", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
          </div>
        </section>

        {/* ========== COLOR & OPACITY ========== */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">색상 및 투명도</label>
          <div className="flex flex-col gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">채우기 색상</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400">{fill === "gradient" ? "GRADIENT" : fill.toUpperCase()}</span>
                <input type="color" value={fill === "gradient" ? "#ffffff" : fill} onChange={(e) => updateProperty("fill", e.target.value)} className="size-6 rounded-full border border-zinc-300 shadow-sm cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">배경 색상</span>
              <div className="flex items-center gap-2">
                <button onClick={() => updateProperty("backgroundColor", "transparent")} className="text-[9px] font-bold text-zinc-400 hover:text-red-400 transition-colors border border-zinc-200 rounded px-1.5 py-0.5" title="배경 제거">없음</button>
                <input type="color" value={typeof (selectedObject as any)?.backgroundColor === "string" && (selectedObject as any).backgroundColor !== "transparent" ? (selectedObject as any).backgroundColor : "#ffffff"} onChange={(e) => updateProperty("backgroundColor", e.target.value)} className="size-6 rounded-full border border-zinc-300 shadow-sm cursor-pointer" />
              </div>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 w-full" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">그라데이션 (프리셋)</span>
              <div className="flex gap-1.5">
                <button onClick={() => applyGradient(["#ff7e5f", "#feb47b"])} className="size-6 rounded-full bg-linear-to-br from-[#ff7e5f] to-[#feb47b] border border-white shadow-sm hover:scale-110 transition-transform" />
                <button onClick={() => applyGradient(["#00c6ff", "#0072ff"])} className="size-6 rounded-full bg-linear-to-br from-[#00c6ff] to-[#0072ff] border border-white shadow-sm hover:scale-110 transition-transform" />
                <button onClick={() => applyGradient(["#43e97b", "#38f9d7"])} className="size-6 rounded-full bg-linear-to-br from-[#43e97b] to-[#38f9d7] border border-white shadow-sm hover:scale-110 transition-transform" />
                <button onClick={() => applyGradient(["#fa709a", "#fee140"])} className="size-6 rounded-full bg-linear-to-br from-[#fa709a] to-[#fee140] border border-white shadow-sm hover:scale-110 transition-transform" />
                <button onClick={() => applyGradient(["#0f2027", "#203a43", "#2c5364"])} className="size-6 rounded-full bg-linear-to-br from-[#0f2027] to-[#2c5364] border border-white shadow-sm hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">Opacity</span><span className="text-[10px] font-mono text-indigo-500">{Math.round(opacity * 100)}%</span></div>
            <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={(e) => updateProperty("opacity", parseFloat(e.target.value))} className="w-full accent-indigo-600" />
          </div>
        </section>
      </div>
    </aside>
  );
}
