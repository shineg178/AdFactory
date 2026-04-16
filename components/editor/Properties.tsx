"use client";

import { useEffect, useState, useRef } from "react";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Trash2,
  Settings2,
  Square,
  Smartphone,
  Layout,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronDown,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";

export default function Properties() {
  const { 
    selectedObject, 
    canvas, 
    canvasWidth, 
    setCanvasWidth, 
    canvasHeight, 
    setCanvasHeight,
    saveHistory,
    customFonts,
    addCustomFont
  } = useEditor();

  const [fontSize, setFontSize] = useState<number>(32);
  const [fill, setFill] = useState<string>("#000000");
  const [scale, setScale] = useState<number>(1);
  const [textAlign, setTextAlign] = useState<string>("left");
  const [fontWeight, setFontWeight] = useState<string>("normal");
  const [fontFamily, setFontFamily] = useState<string>("Pretendard");
  
  const fontInputRef = useRef<HTMLInputElement>(null);

  const isText = selectedObject && (
    selectedObject.type === "text" || 
    selectedObject.type === "i-text" || 
    selectedObject.type === "textbox"
  );

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
    setScale(Math.round((selectedObject.scaleX || 1) * 100) / 100);
  }, [selectedObject, isText]);

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;
    if (key === "scale") {
      selectedObject.set("scaleX", value);
      selectedObject.set("scaleY", value);
      setScale(value);
    } else {
      selectedObject.set(key as any, value);
      if (key === "fontSize") setFontSize(value);
      if (key === "fill") setFill(value);
      if (key === "textAlign") setTextAlign(value);
      if (key === "fontWeight") setFontWeight(value);
      if (key === "fontFamily") setFontFamily(value);
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
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const layerAction = (action: "front" | "back" | "forward" | "backward") => {
    if (!selectedObject || !canvas) return;
    switch (action) {
      case "front": canvas.bringObjectToFront(selectedObject); break;
      case "back": 
        canvas.sendObjectToBack(selectedObject); 
        const artboard = canvas.getObjects().find(o => (o as any).isArtboard);
        if (artboard) canvas.sendObjectToBack(artboard);
        break;
      case "forward": canvas.bringObjectForward(selectedObject); break;
      case "backward": 
        const index = canvas.getObjects().indexOf(selectedObject);
        const artboardIdx = canvas.getObjects().findIndex(o => (o as any).isArtboard);
        if (index > artboardIdx + 1) canvas.sendObjectBackwards(selectedObject);
        break;
    }
    canvas.renderAll();
    saveHistory();
  };

  if (!selectedObject) {
    const ratios = [
      { name: "1:1 정방형", w: 1080, h: 1080, icon: "w-4 h-4" },
      { name: "9:16 피드/스토리", w: 1080, h: 1920, icon: "w-3 h-5.5" },
      { name: "16:9 가로형", w: 1920, h: 1080, icon: "w-5.5 h-3" },
      { name: "4:5 인스타그램", w: 1080, h: 1350, icon: "w-4 h-5" },
      { name: "3:4 초상화", w: 1080, h: 1440, icon: "w-3 h-4" },
      { name: "2:1 와이드", w: 2000, h: 1000, icon: "w-6 h-3" },
    ];

    return (
      <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <Settings2 className="size-4 text-zinc-900 dark:text-zinc-100" />
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">캔버스 설정</h3>
        </div>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">해상도</label>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <span className="text-[10px] text-zinc-500 font-bold pl-1 uppercase">Width</span>
               <input type="number" value={canvasWidth} onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 1)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
             </div>
             <div className="space-y-1.5">
               <span className="text-[10px] text-zinc-500 font-bold pl-1 uppercase">Height</span>
               <input type="number" value={canvasHeight} onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 1)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
             </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">비율 프리셋</label>
          <div className="flex flex-col gap-2">
            {ratios.map((r) => (
              <button
                key={r.name}
                onClick={() => { setCanvasWidth(r.w); setCanvasHeight(r.h); }}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left",
                  canvasWidth === r.w && canvasHeight === r.h
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                    : "border-zinc-100 dark:border-zinc-900 hover:border-zinc-200"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200">
                  <div className={cn("bg-zinc-300 dark:bg-zinc-600 rounded-sm shadow-inner", r.icon)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{r.name}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{r.w} x {r.h}</span>
                </div>
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
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{isText ? "텍스트 속성" : "객체 속성"}</h3>
        <button onClick={deleteObject} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="size-4" /></button>
      </div>

      <div className="flex flex-col gap-7">
        <section className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">레이어 순서</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={() => layerAction("front")} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 text-zinc-600 hover:text-indigo-600 transition-all flex items-center justify-center"><ArrowUpToLine className="size-4" /></button>
            <button onClick={() => layerAction("forward")} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 text-zinc-600 hover:text-indigo-600 transition-all flex items-center justify-center"><MoveUp className="size-4" /></button>
            <button onClick={() => layerAction("backward")} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 text-zinc-600 hover:text-indigo-600 transition-all flex items-center justify-center"><MoveDown className="size-4" /></button>
            <button onClick={() => layerAction("back")} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 text-zinc-600 hover:text-indigo-600 transition-all flex items-center justify-center"><ArrowDownToLine className="size-4" /></button>
          </div>
        </section>

        {isText && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">타이포그래피</label>
              <button 
                onClick={() => fontInputRef.current?.click()}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                <Upload className="size-3" />
                업로드
              </button>
              <input type="file" ref={fontInputRef} onChange={handleFontUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" />
            </div>

            <div className="relative group">
              <select 
                value={fontFamily}
                onChange={(e) => updateProperty("fontFamily", e.target.value)}
                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-10"
              >
                {customFonts.map(f => (
                  <option key={f.name} value={f.family}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-hover:text-zinc-600 pointer-events-none" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-bold pl-1">폰트 크기</span>
                <span className="text-[10px] font-mono text-indigo-500 font-bold">{fontSize}px</span>
              </div>
              <input type="range" min="8" max="250" value={fontSize} onChange={(e) => updateProperty("fontSize", parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>

            <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 shadow-inner">
               <button onClick={() => updateProperty("fontWeight", fontWeight === "bold" ? "normal" : "bold")} className={cn("flex-1 p-2 rounded-lg transition-all", fontWeight === "bold" ? "bg-white dark:bg-zinc-800 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-600")}><Bold className="size-4 mx-auto" /></button>
               <button className="flex-1 p-2 rounded-lg text-zinc-400 hover:text-zinc-600"><Italic className="size-4 mx-auto" /></button>
               <button className="flex-1 p-2 rounded-lg text-zinc-400 hover:text-zinc-600"><Underline className="size-4 mx-auto" /></button>
            </div>
            
            <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 shadow-inner">
              {[ { id: "left", icon: AlignLeft }, { id: "center", icon: AlignCenter }, { id: "right", icon: AlignRight }, { id: "justify", icon: AlignJustify } ].map((align) => (
                <button key={align.id} onClick={() => updateProperty("textAlign", align.id)} className={cn("flex-1 p-2 rounded-lg transition-all", textAlign === align.id ? "bg-white dark:bg-zinc-800 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-600")}><align.icon className="size-4 mx-auto" /></button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">위치 및 배율</label>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <span className="text-[10px] text-zinc-500 font-bold pl-1 uppercase">X</span>
               <input type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => updateProperty("left", parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
             </div>
             <div className="space-y-1.5">
               <span className="text-[10px] text-zinc-500 font-bold pl-1 uppercase">Y</span>
               <input type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => updateProperty("top", parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
             </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold pl-1">배율</span>
              <span className="text-[10px] font-mono text-indigo-500 font-bold">{Math.round((selectedObject.scaleX || 1) * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="10" step="0.1" value={selectedObject.scaleX || 1} onChange={(e) => updateProperty("scale", parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">스타일</label>
          <div className="space-y-3">
             <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200">
               <div className="flex items-center gap-3">
                 <input type="color" value={fill === "transparent" ? "#000000" : fill} onChange={(e) => updateProperty("fill", e.target.value)} className="size-7 rounded-full cursor-pointer border-2 border-white shadow-sm" />
                 <span className="text-xs font-mono text-zinc-500 uppercase tracking-tighter">{fill}</span>
               </div>
               <span className="text-[10px] font-black text-zinc-400">색상</span>
             </div>
             
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-bold pl-1">불투명도</span>
                 <span className="text-[10px] font-mono text-indigo-500 font-bold">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
               </div>
               <input type="range" min="0" max="1" step="0.01" value={selectedObject.opacity || 1} onChange={(e) => updateProperty("opacity", parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
             </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
