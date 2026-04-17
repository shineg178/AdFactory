"use client";

import { Download, Save, Undo, Redo, ZoomIn, ZoomOut, Loader2, FileCode, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import { useState } from "react";
import { Point } from "fabric";

export default function Navbar() {
  const { canvas, zoom, setZoom, undo, redo, canvasWidth, canvasHeight, resetDesign } = useEditor();
  const [isExporting, setIsExporting] = useState(false);
  const [isSVGExporting, setIsSVGExporting] = useState(false);

  const handleZoom = (newZoom: number) => {
    if (!canvas) return;
    const clampedZoom = Math.min(Math.max(newZoom, 0.05), 15);
    setZoom(clampedZoom);
    const center = new Point(canvas.width / 2, canvas.height / 2);
    canvas.zoomToPoint(center, clampedZoom);
    canvas.renderAll();
  };

  const exportImage = () => {
    if (!canvas) return;
    setIsExporting(true);
    setTimeout(() => {
      const vpt = canvas.viewportTransform;
      const currentZoom = canvas.getZoom();
      
      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: (1 / currentZoom) * 2,
        left: vpt[4] - (canvasWidth / 2) * currentZoom,
        top: vpt[5] - (canvasHeight / 2) * currentZoom,
        width: canvasWidth * currentZoom,
        height: canvasHeight * currentZoom,
      });
      const link = document.createElement("a");
      link.download = `AD-Factory-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setIsExporting(false);
    }, 100);
  };

  // Figma/Illustrator compatible SVG Export
  const exportSVG = () => {
    if (!canvas) return;
    setIsSVGExporting(true);
    setTimeout(() => {
      // Create a temporary SVG with limited viewport to match artboard
      const svg = canvas.toSVG({
        width: canvasWidth.toString(),
        height: canvasHeight.toString(),
        viewBox: {
          x: -canvasWidth / 2,
          y: -canvasHeight / 2,
          width: canvasWidth,
          height: canvasHeight,
        },
      });
      
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `AD-Factory-Vector-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setIsSVGExporting(false);
    }, 100);
  };

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950 z-30 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="size-11 flex items-center justify-center overflow-hidden">
            <img src="/logo.svg" alt="Muddy Potato" className="w-full h-full object-contain scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">AD-Factory</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">알감자 스튜디오</span>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
        
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner">
          <button onClick={() => handleZoom(zoom - 0.1)} className="text-zinc-400 hover:text-indigo-600 transition-colors"><ZoomOut className="size-4" /></button>
          <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 min-w-11.25 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => handleZoom(zoom + 0.1)} className="text-zinc-400 hover:text-indigo-600 transition-colors"><ZoomIn className="size-4" /></button>
        </div>

        <div className="flex items-center gap-1.5 border-l border-zinc-100 dark:border-zinc-800 pl-4 ml-1">
          <button onClick={undo} title="실행 취소 (Ctrl+Z)" className="rounded-lg p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"><Undo className="size-4" /></button>
          <button onClick={redo} title="다시 실행 (Ctrl+Shift+Z)" className="rounded-lg p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"><Redo className="size-4" /></button>
          <button onClick={resetDesign} title="초기화" className="rounded-lg p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100"><RotateCcw className="size-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 transition-all shadow-sm">
          <Save className="size-4" />
          저장
        </button>
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* New SVG Export for Figma/Pro Tools */}
        <button 
          onClick={exportSVG} disabled={isSVGExporting}
          className="flex items-center gap-2 rounded-xl border-2 border-zinc-100 bg-white px-4 py-2 text-xs font-bold text-zinc-600 hover:border-indigo-500 hover:text-indigo-600 dark:bg-zinc-900 dark:border-zinc-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSVGExporting ? <Loader2 className="size-4 animate-spin" /> : <FileCode className="size-4" />}
          SVG (Figma)
        </button>

        <button 
          onClick={exportImage} disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          PNG 다운로드
        </button>
      </div>
    </nav>
  );
}
