"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, Point, Textbox, FabricObject, Rect, Shadow } from "fabric";
import { useEditor } from "./EditorContext";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    setCanvas, 
    setSelectedObject, 
    setZoom, 
    zoom,
    undo, 
    redo, 
    saveHistory, 
    setActiveTab,
    canvasWidth,
    canvasHeight,
    canvas: currentCanvas
  } = useEditor();

  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Helper to fit artboard to screen
  const autoFit = useCallback((c: FabricCanvas) => {
    if (!containerRef.current || !c) return;
    const padding = 120;
    const cw = containerRef.current.clientWidth - padding;
    const ch = containerRef.current.clientHeight - padding;
    
    // Logic: calculate required zoom to fit the current canvasWidth/Height
    const scale = Math.min(cw / canvasWidth, ch / canvasHeight);
    const finalZoom = Math.min(scale, 1.2); 
    
    c.setZoom(finalZoom);
    setZoom(finalZoom);
    
    // Re-center camera over (0,0) - our absolute center
    const vpt = c.viewportTransform;
    vpt[4] = containerRef.current.clientWidth / 2;
    vpt[5] = containerRef.current.clientHeight / 2;
    c.requestRenderAll();
  }, [canvasWidth, canvasHeight, setZoom]);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const c = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#09090b", // Absolute dark room for canvas workspace
      preserveObjectStacking: true,
      selection: true,
    });

    setCanvas(c);

    // --- Create Artboard ---
    const artboard = new Rect({
      width: canvasWidth,
      height: canvasHeight,
      left: 0,
      top: 0,
      originX: "center",
      originY: "center",
      fill: "#ffffff",
      selectable: false,
      evented: false,
      shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 50, offsetX: 0, offsetY: 0 }),
    });
    (artboard as any).isArtboard = true;
    c.add(artboard);
    c.sendObjectToBack(artboard);

    // Initial positioning
    setTimeout(() => autoFit(c), 100);

    // Global Object Styling
    FabricObject.prototype.set({
      cornerColor: "#6366f1", 
      cornerStyle: "circle", 
      borderColor: "#6366f1",
      cornerSize: 12, 
      transparentCorners: false, 
      padding: 5,
      borderDashArray: [5, 5],
    });

    // Events
    c.on("selection:created", (options) => setSelectedObject(options.selected[0] || null));
    c.on("selection:updated", (options) => setSelectedObject(options.selected[0] || null));
    c.on("selection:cleared", () => setSelectedObject(null));
    c.on("object:modified", () => saveHistory());
    
    // Panning (Alt + Drag or Drag Background)
    c.on("mouse:down", (opt) => {
      const evt = opt.e as any;
      if (evt.altKey || !opt.target || (opt.target as any).isArtboard) {
        isDragging.current = true;
        c.selection = false;
        lastX.current = evt.clientX || (evt.touches && evt.touches[0].clientX);
        lastY.current = evt.clientY || (evt.touches && evt.touches[0].clientY);
      }
    });

    c.on("mouse:move", (opt) => {
      if (isDragging.current) {
        const evt = opt.e as any;
        const currentX = evt.clientX || (evt.touches && evt.touches[0].clientX);
        const currentY = evt.clientY || (evt.touches && evt.touches[0].clientY);
        const vpt = c.viewportTransform;
        vpt[4] += currentX - lastX.current;
        vpt[5] += currentY - lastY.current;
        c.requestRenderAll();
        lastX.current = currentX;
        lastY.current = currentY;
      }
    });

    c.on("mouse:up", () => {
      isDragging.current = false;
      c.selection = true;
    });

    // Zoom (Ctrl + Wheel)
    c.on("mouse:wheel", (opt) => {
      if (!opt.e.ctrlKey) return;
      const delta = opt.e.deltaY;
      let newZoom = c.getZoom();
      newZoom *= 0.999 ** delta;
      if (newZoom > 20) newZoom = 20;
      if (newZoom < 0.01) newZoom = 0.01;
      const point = new Point(opt.e.offsetX, opt.e.offsetY);
      c.zoomToPoint(point, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Initial content
    const title = new Textbox("제목을 입력하세요", {
      originX: 'center', originY: 'center',
      left: 0, top: 0, 
      fontSize: 64, fill: "#111111", fontWeight: "bold", width: 800,
      textAlign: "center"
    });
    c.add(title);

    // Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") return;
      const activeObject = c.getActiveObject();
      if ((activeObject as any)?.isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const actives = c.getActiveObjects();
        if (actives.length > 0) {
          c.remove(...actives);
          c.discardActiveObject();
          c.requestRenderAll();
          saveHistory();
        }
      }
      if (e.ctrlKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if (e.key.toLowerCase() === "v") setActiveTab("select");
      if (e.key.toLowerCase() === "t") setActiveTab("text");
    };

    window.addEventListener("keydown", handleKeyDown);
    const handleResize = () => {
      if (!containerRef.current) return;
      c.setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      autoFit(c);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      c.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update effect for dynamic Resolution / Ratio changes
  useEffect(() => {
    if (!currentCanvas) return;
    const artboard = currentCanvas.getObjects().find(o => (o as any).isArtboard) as Rect;
    if (artboard) artboard.set({ width: canvasWidth, height: canvasHeight });

    currentCanvas.clipPath = new Rect({
      width: canvasWidth, height: canvasHeight,
      left: 0, top: 0,
      originX: "center", originY: "center",
      absolutePositioned: false
    });

    autoFit(currentCanvas);
    currentCanvas.requestRenderAll();
  }, [canvasWidth, canvasHeight, currentCanvas, autoFit]);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-zinc-950 shadow-inner flex items-center justify-center p-0 outline-none">
      <div className="w-full h-full">
        <canvas ref={canvasRef} />
      </div>
      
      {/* HUD Overlay */}
      <div className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 shadow-2xl select-none flex items-center gap-4">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Zoom</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{Math.round(zoom * 100)}%</span>
           </div>
           <div className="w-px h-6 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Artboard</span>
              <span className="text-xs font-mono font-bold text-white">{canvasWidth} x {canvasHeight} PX</span>
           </div>
        </div>
      </div>
    </div>
  );
}
