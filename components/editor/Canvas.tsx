"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditor } from "./EditorContext";
import { cn } from "@/lib/utils";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, setZoom } = useEditor();

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Initialize Fabric Canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 800,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    // Event Listeners
    fabricCanvas.on("selection:created", (options) => {
      setSelectedObject(options.selected[0] || null);
    });

    fabricCanvas.on("selection:updated", (options) => {
      setSelectedObject(options.selected[0] || null);
    });

    fabricCanvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    // Control point styling for all objects
    fabric.FabricObject.prototype.set({
      cornerColor: "#4f46e5",
      cornerStyle: "circle",
      borderColor: "#4f46e5",
      cornerSize: 10,
      transparentCorners: false,
      padding: 5,
    });

    // Initial Content (Korean)
    const title = new fabric.FabricText("제품 제목을 입력하세요", {
      left: 80,
      top: 100,
      fontSize: 52,
      fill: "#111111",
      fontWeight: "bold",
    });
    
    const subtitle = new fabric.FabricText("메인 특징이나 할인 혜택을 적어주세요", {
      left: 80,
      top: 180,
      fontSize: 26,
      fill: "#666666",
    });

    fabricCanvas.add(title, subtitle);
    fabricCanvas.renderAll();

    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [setCanvas, setSelectedObject]);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 shadow-inner flex items-center justify-center p-12 custom-scrollbar">
      <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-200 dark:border-zinc-800 rounded-sm transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
        <canvas ref={canvasRef} />
      </div>
      
      {/* Canvas Info Overlay */}
      <div className="absolute bottom-6 right-6 flex items-center bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 gap-4 shadow-sm select-none">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Canvas Resolution</span>
          <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">800 x 800 px</span>
        </div>
      </div>
    </div>
  );
}
