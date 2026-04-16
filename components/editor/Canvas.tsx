"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditor } from "./EditorContext";
import { cn } from "@/lib/utils";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, setZoom, zoom, undo, redo, saveHistory, setActiveTab } = useEditor();

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

    fabricCanvas.on("object:modified", () => {
      saveHistory();
    });

    // Control point styling
    fabric.FabricObject.prototype.set({
      cornerColor: "#4f46e5",
      cornerStyle: "circle",
      borderColor: "#4f46e5",
      cornerSize: 10,
      transparentCorners: false,
      padding: 5,
    });

    // --- 1. Ctrl + Scroll Zoom Logic ---
    fabricCanvas.on("mouse:wheel", (opt) => {
      if (!opt.e.ctrlKey) return; // Only zoom when Ctrl is pressed
      
      const delta = opt.e.deltaY;
      let newZoom = fabricCanvas.getZoom();
      newZoom *= 0.999 ** delta;
      
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.1) newZoom = 0.1;

      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Initial Content
    const title = new fabric.Textbox("제품 제목을 입력하세요", {
      left: 80,
      top: 100,
      fontSize: 52,
      fill: "#111111",
      fontWeight: "bold",
      width: 640
    });
    
    const subtitle = new fabric.Textbox("메인 특징이나 할인 혜택을 적어주세요", {
      left: 80,
      top: 180,
      fontSize: 26,
      fill: "#666666",
      width: 640
    });

    fabricCanvas.add(title, subtitle);
    fabricCanvas.renderAll();
    
    // Initial History Save
    const initialJson = JSON.stringify(fabricCanvas.toDatalessJSON());
    // We can't easily call saveHistory here because it closure-captures 'canvas' from context which isn't set yet.
    // But setting it in context will make next calls work.

    // --- 2. Keyboard Shortcuts (Photoshop-like) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or fabric textbox
      const activeElement = document.activeElement as HTMLElement;
      const isInput = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";
      const isEditingFabric = fabricCanvas.getActiveObject()?.isEditing;
      
      if (isInput || isEditingFabric) return;

      // Delete Key
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
          fabricCanvas.remove(...activeObjects);
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
          saveHistory();
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if ((e.ctrlKey && e.shiftKey && e.key === "Z") || (e.ctrlKey && e.key === "y")) {
        e.preventDefault();
        redo();
      }

      // V: Selection Tool
      if (e.key.toLowerCase() === "v") {
        setActiveTab("select");
      }

      // T: Text Tool
      if (e.key.toLowerCase() === "t") {
        setActiveTab("text");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [setCanvas, setSelectedObject, setZoom, undo, redo, saveHistory, setActiveTab]);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 shadow-inner flex items-center justify-center p-12 custom-scrollbar">
      <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-200 dark:border-zinc-800 rounded-sm">
        <canvas ref={canvasRef} />
      </div>
      
      {/* Canvas Info Overlay */}
      <div className="absolute bottom-6 right-6 flex items-center bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 gap-4 shadow-sm select-none">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">캔버스 해상도</span>
          <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">800 x 800 px</span>
        </div>
      </div>
    </div>
  );
}
