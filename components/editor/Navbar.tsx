"use client";

import { Download, Save, Undo, Redo, Share2, Loader2, Search, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { canvas, zoom, setZoom } = useEditor();
  const [isExporting, setIsExporting] = useState(false);

  const exportCanvas = () => {
    if (!canvas) return;
    setIsExporting(true);
    
    setTimeout(() => {
      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 2,
      });
      
      const link = document.createElement("a");
      link.download = `광고소재-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setIsExporting(false);
    }, 500);
  };

  const handleZoom = (newZoom: number) => {
    if (!canvas) return;
    const clampedZoom = Math.min(Math.max(newZoom, 0.1), 3);
    setZoom(clampedZoom);
    canvas.setZoom(clampedZoom);
    canvas.renderAll();
  };

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              AdFactory
            </span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
              자동화 에디터
            </span>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
        
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
           <button 
             onClick={() => handleZoom(zoom - 0.1)}
             className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
           >
             <ZoomOut className="size-4" />
           </button>
           <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 min-w-[40px] text-center">
             {Math.round(zoom * 100)}%
           </span>
           <button 
             onClick={() => handleZoom(zoom + 0.1)}
             className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
           >
             <ZoomIn className="size-4" />
           </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => canvas?.undo?.()}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <Undo className="size-4" />
          </button>
          <button 
             onClick={() => canvas?.redo?.()}
             className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <Redo className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mr-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse mr-2" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">자동 저장됨</span>
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all">
          <Save className="size-4" />
          저장
        </button>
        
        <button 
          onClick={exportCanvas}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {isExporting ? "내보내는 중..." : "PNG 다운로드"}
        </button>
      </div>
    </nav>
  );
}
