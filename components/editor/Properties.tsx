"use client";

import { useEffect, useState, useRef } from "react";
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Trash2, Settings2,
  MoveUp, MoveDown, ArrowUpToLine, ArrowDownToLine,
  ChevronDown, Upload, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Type, Layers, BoxSelect as ShadowIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import { Shadow } from "fabric";

export default function Properties() {
  const { 
    selectedObject, canvas, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight,
    saveHistory, customFonts, addCustomFont, alignObject, loadSystemFonts
  } = useEditor();

  const [fontSize, setFontSize] = useState<number>(32);
  const [fill, setFill] = useState<string>("#000000");
  const [scale, setScale] = useState<number>(1);
  const [textAlign, setTextAlign] = useState<string>("left");
  const [fontWeight, setFontWeight] = useState<string>("normal");
  const [fontFamily, setFontFamily] = useState<string>("Pretendard");
  
  // Advanced Styles
  const [stroke, setStroke] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [shadowBlur, setShadowBlur] = useState<number>(0);
  const [shadowColor, setShadowColor] = useState<string>("#000000");

  const [localWidth, setLocalWidth] = useState<string>("");
  const [localHeight, setLocalHeight] = useState<string>("");
  const [localX, setLocalX] = useState<string>("");
  const [localY, setLocalY] = useState<string>("");

  const fontInputRef = useRef<HTMLInputElement>(null);

  const isText = selectedObject && (selectedObject.type === "text" || selectedObject.type === "i-text" || selectedObject.type === "textbox");

  useEffect(() => {
    if (!selectedObject) return;
    if (isText) {
      const textObj = selectedObject as any;
      setFontSize(textObj.fontSize || 32);
      setFill(textObj.fill as string || "#000000");
      setTextAlign(textObj.textAlign || "left");
      setFontWeight(textObj.fontWeight || "normal");
      setFontFamily(textObj.fontFamily || "Pretendard");
    }
    const s = Math.round((selectedObject.scaleX || 1) * 100) / 100;
    setScale(s);
    setLocalX(Math.round(selectedObject.left || 0).toString());
    setLocalY(Math.round(selectedObject.top || 0).toString());
    
    setStroke((selectedObject as any).stroke || "transparent");
    setStrokeWidth((selectedObject as any).strokeWidth || 0);
    
    if (selectedObject.shadow instanceof Shadow) {
      setShadowBlur((selectedObject.shadow as Shadow).blur || 0);
      setShadowColor((selectedObject.shadow as Shadow).color || "#000000");
    } else {
      setShadowBlur(0);
    }
  }, [selectedObject, isText]);

  useEffect(() => {
    setLocalWidth(canvasWidth.toString());
    setLocalHeight(canvasHeight.toString());
  }, [canvasWidth, canvasHeight]);

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;
    if (key === "scale") {
      selectedObject.set({ scaleX: value, scaleY: value });
      setScale(value);
    } else if (key === "shadow") {
      selectedObject.set("shadow", new Shadow({ color: shadowColor, blur: value, offsetX: 0, offsetY: 0 }));
      setShadowBlur(value);
    } else if (key === "shadowColor") {
      selectedObject.set("shadow", new Shadow({ color: value, blur: shadowBlur, offsetX: 0, offsetY: 0 }));
      setShadowColor(value);
    } else {
      // Dynamic @font-face injection for local/system fonts
      if (key === "fontFamily") {
        const font = customFonts.find(f => f.family === value);
        if (font && font.postscriptName) {
          const styleId = `font-sync-${font.family.replace(/\s+/g, '-')}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
              @font-face {
                font-family: "${font.family}";
                src: local("${font.fullName}"), local("${font.postscriptName}"), local("${font.family}");
              }
            `;
            document.head.appendChild(style);
            
            // Re-render after a brief moment to allow browser font mapping
            setTimeout(() => {
              if (canvas) {
                selectedObject.set("fontFamily", value);
                canvas.requestRenderAll();
              }
            }, 50);
          }
        }
      }

      selectedObject.set(key as any, value);
      if (key === "fontSize") setFontSize(value);
      if (key === "fill") setFill(value);
      if (key === "textAlign") setTextAlign(value);
      if (key === "fontWeight") setFontWeight(value);
      if (key === "fontFamily") setFontFamily(value);
      if (key === "stroke") setStroke(value);
      if (key === "strokeWidth") setStrokeWidth(value);
    }
    canvas.renderAll();
  };

  const deleteObject = () => {
    if (!selectedObject || !canvas) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    saveHistory();
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = file.name.split('.')[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fontData = event.target?.result as ArrayBuffer;
      const font = new FontFace(fontName, fontData);
      try {
        await font.load();
        document.fonts.add(font);
        addCustomFont(fontName, fontName);
        updateProperty("fontFamily", fontName);
      } catch (err) { console.error(err); }
    };
    reader.readAsArrayBuffer(file);
  };

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
        
        {/* Local System Font Access */}
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
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">해상도</label>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 font-bold uppercase">W</span>
               <input type="number" value={localWidth} onChange={(e) => { setLocalWidth(e.target.value); const v=parseInt(e.target.value); if(!isNaN(v)) setCanvasWidth(v); }} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
             </div>
             <div className="space-y-1.5"><span className="text-[10px] text-zinc-500 font-bold uppercase">H</span>
               <input type="number" value={localHeight} onChange={(e) => { setLocalHeight(e.target.value); const v=parseInt(e.target.value); if(!isNaN(v)) setCanvasHeight(v); }} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
             </div>
          </div>
        </section>

        {/* Global Font Asset Library - Simplified UI */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">폰트 자산 추가</label>
            <button 
              onClick={() => fontInputRef.current?.click()}
              className="p-1 px-2 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 transition-colors"
            >
              파일 업로드 (.ttf, .otf)
            </button>
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

  return (
    <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h3 className="text-sm font-black uppercase tracking-tight">{isText ? "텍스트" : "객체"} 설정</h3>
        <button onClick={deleteObject} className="p-2 text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="size-4" /></button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Alignment Tools */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">정렬 (Artboard 기준)</label>
          <div className="grid grid-cols-6 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200">
             <button onClick={() => alignObject("left")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignStartHorizontal className="size-4" /></button>
             <button onClick={() => alignObject("center")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignCenterHorizontal className="size-4" /></button>
             <button onClick={() => alignObject("right")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignEndHorizontal className="size-4" /></button>
             <button onClick={() => alignObject("top")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignStartVertical className="size-4" /></button>
             <button onClick={() => alignObject("middle")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignCenterVertical className="size-4" /></button>
             <button onClick={() => alignObject("bottom")} className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"><AlignEndVertical className="size-4" /></button>
          </div>
        </section>

        {isText && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">타이포그래피</label>
              <button onClick={() => fontInputRef.current?.click()} className="flex items-center gap-1 text-[10px] font-bold text-indigo-500"><Upload className="size-3" /> 업로드</button>
              <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.otf,.woff" />
            </div>
            <select 
              value={fontFamily} 
              onChange={(e) => updateProperty("fontFamily", e.target.value)} 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold outline-none custom-scrollbar"
            >
              {customFonts.map(f => (
                <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>
                  {f.name} (Aa)
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">Size</span><span className="text-[10px] font-mono text-indigo-500">{fontSize}px</span></div>
              <input type="range" min="8" max="250" value={fontSize} onChange={(e) => updateProperty("fontSize", parseInt(e.target.value))} className="w-full accent-indigo-600" />
            </div>
          </section>
        )}

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
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">색상 및 투명도</label>
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200">
             <input type="color" value={fill} onChange={(e) => updateProperty("fill", e.target.value)} className="size-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
             <span className="text-xs font-mono font-bold">{fill.toUpperCase()}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-500 font-bold uppercase">Opacity</span><span className="text-[10px] font-mono text-indigo-500">{Math.round((selectedObject.opacity || 1) * 100)}%</span></div>
            <input type="range" min="0" max="1" step="0.01" value={selectedObject.opacity || 1} onChange={(e) => updateProperty("opacity", parseFloat(e.target.value))} className="w-full accent-indigo-600" />
          </div>
        </section>
      </div>
    </aside>
  );
}
