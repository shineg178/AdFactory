"use client";

import { useEffect, useState } from "react";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Underline,
  Trash2,
  Layers as LayersIcon,
  MousePointer2,
  Maximize
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import * as fabric from "fabric";

export default function Properties() {
  const { selectedObject, canvas } = useEditor();
  const [fontSize, setFontSize] = useState<number>(32);
  const [fill, setFill] = useState<string>("#000000");
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    if (!selectedObject) return;
    
    // Sync state with selected object
    if (selectedObject instanceof fabric.FabricText) {
      setFontSize(selectedObject.fontSize);
      setFill(selectedObject.fill as string);
    }
    
    setScale(Math.round((selectedObject.scaleX || 1) * 100) / 100);
  }, [selectedObject]);

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
    }
    
    canvas.renderAll();
  };

  const deleteObject = () => {
    if (!selectedObject || !canvas) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  if (!selectedObject) {
    return (
      <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
        <div className="size-12 rounded-full bg-zinc-50 flex items-center justify-center mb-4 dark:bg-zinc-900 shadow-inner">
          <MousePointer2 className="size-6 text-zinc-300" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          선택된 개체 없음
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          캔버스 위의 요소를 선택하여<br/>속성을 변경해보세요.
        </p>
      </aside>
    );
  }

  const isText = selectedObject instanceof fabric.FabricText;

  return (
    <aside className="w-72 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-8 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          {isText ? "텍스트 속성" : "객체 속성"}
        </h3>
        <button 
          onClick={deleteObject}
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Position & Scale */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">위치 및 배율</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-bold pl-1">X 좌표</span>
              <input 
                type="number" 
                value={Math.round(selectedObject.left || 0)} 
                onChange={(e) => updateProperty("left", parseInt(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-bold pl-1">Y 좌표</span>
              <input 
                type="number" 
                value={Math.round(selectedObject.top || 0)}
                onChange={(e) => updateProperty("top", parseInt(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold pl-1">크기 배율 (Magnification)</span>
              <span className="text-[10px] font-mono text-indigo-500 font-bold">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0.1" max="5" step="0.1"
                value={scale}
                onChange={(e) => updateProperty("scale", parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </section>

        {isText && (
          <section className="space-y-5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">타이포그래피</label>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-bold pl-1">폰트 크기</span>
                <span className="text-[10px] font-mono text-indigo-500 font-bold">{fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="8" max="200" 
                value={fontSize}
                onChange={(e) => updateProperty("fontSize", parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={() => updateProperty("fontWeight", selectedObject.fontWeight === "bold" ? "normal" : "bold")}
                title="굵게"
                className={cn(
                  "flex-1 p-2 rounded-lg transition-all",
                  selectedObject.fontWeight === "bold" ? "bg-white dark:bg-zinc-800 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <Bold className="size-4 mx-auto" />
              </button>
              <button 
                title="기울임꼴"
                className="flex-1 p-2 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
              >
                <Italic className="size-4 mx-auto" />
              </button>
              <button 
                title="밑줄"
                className="flex-1 p-2 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
              >
                <Underline className="size-4 mx-auto" />
              </button>
            </div>
            
            <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button className="flex-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all">
                <AlignLeft className="size-4 mx-auto" />
              </button>
              <button className="flex-1 p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 transition-all">
                <AlignCenter className="size-4 mx-auto" />
              </button>
              <button className="flex-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all">
                <AlignRight className="size-4 mx-auto" />
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">스타일 및 투명도</label>
          <div className="space-y-3">
             <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-3">
                 <input 
                  type="color" 
                  value={fill === "transparent" ? "#000000" : fill} 
                  onChange={(e) => updateProperty("fill", e.target.value)}
                  className="size-7 rounded-full cursor-pointer border-2 border-white dark:border-zinc-800 shadow-sm"
                 />
                 <span className="text-xs font-mono text-zinc-500 uppercase tracking-tighter">{fill}</span>
               </div>
               <span className="text-[10px] font-black text-zinc-400">색상</span>
             </div>
             
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-bold pl-1">불투명도</span>
                 <span className="text-[10px] font-mono text-indigo-500 font-bold">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
               </div>
               <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={selectedObject.opacity || 1}
                  onChange={(e) => updateProperty("opacity", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>
          </div>
        </section>
      </div>
      
      <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <button className="w-full group flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-95">
          <LayersIcon className="size-3 transition-transform group-hover:rotate-12" />
          레이어 순서 변경
        </button>
      </div>
    </aside>
  );
}
