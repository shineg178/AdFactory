"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, Point, Textbox, FabricObject, Rect, Shadow } from "fabric";
import { useEditor } from "./EditorContext";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    setCanvas, setSelectedObject, setZoom, zoom, undo, redo, saveHistory, 
    setActiveTab, canvasWidth, canvasHeight, canvas: currentCanvas,
    copy, paste, groupObjects, ungroupObjects
  } = useEditor();

  const isPanning = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const spacePressed = useRef(false);

  const autoFit = useCallback((c: FabricCanvas) => {
    if (!containerRef.current || !c) return;
    const padding = 160;
    const scale = Math.min(
      (containerRef.current.clientWidth - padding) / canvasWidth, 
      (containerRef.current.clientHeight - padding) / canvasHeight
    );
    const finalZoom = Math.min(scale, 1.2); 
    c.setZoom(finalZoom);
    setZoom(finalZoom);
    
    const vpt = c.viewportTransform;
    vpt[4] = containerRef.current.clientWidth / 2;
    vpt[5] = containerRef.current.clientHeight / 2;
    c.requestRenderAll();
  }, [canvasWidth, canvasHeight, setZoom]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const c = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#09090b",
      preserveObjectStacking: true,
      selection: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    setCanvas(c);

    const savedDesign = localStorage.getItem("ad-factory-last-design");
    if (savedDesign) {
      try {
        c.loadFromJSON(savedDesign).then(() => {
          let ab = c.getObjects().find(o => (o as any).isArtboard);
          
          // If artboard flag was lost in previous saves, try to find the earliest white rect
          if (!ab) {
            const possibleAb = c.getObjects().find(o => o.type === 'rect' && o.fill === '#ffffff' && Math.round(o.width!) === canvasWidth);
            if (possibleAb) {
              ab = possibleAb;
              (ab as any).isArtboard = true;
            } else {
              // Recreate if entirely missing
              ab = new Rect({
                width: canvasWidth, height: canvasHeight,
                left: 0, top: 0, originX: "center", originY: "center",
                fill: "#ffffff", selectable: false, evented: false,
                lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true,
                hasControls: false, hasBorders: false,
                shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 50, offsetX: 0, offsetY: 0 })
              });
              (ab as any).isArtboard = true;
              c.add(ab);
            }
          }

          if (ab) {
            ab.set({ 
              selectable: false, evented: false, lockMovementX: true, lockMovementY: true,
              lockScalingX: true, lockScalingY: true, lockRotation: true,
              hasControls: false, hasBorders: false
            });
            c.sendObjectToBack(ab);
          }
          autoFit(c);
          c.renderAll();
        });
      } catch (e) {
        console.error("복구 실패:", e);
      }
    } else {
      const artboard = new Rect({
        width: canvasWidth, height: canvasHeight,
        left: 0, top: 0, originX: "center", originY: "center",
        fill: "#ffffff", selectable: false, evented: false,
        lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true,
        hasControls: false, hasBorders: false,
        shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 50, offsetX: 0, offsetY: 0 }),
      });
      (artboard as any).isArtboard = true;
      c.add(artboard);
      c.sendObjectToBack(artboard);
      autoFit(c);
    }

    setTimeout(() => autoFit(c), 100);

    // Events
    c.on("selection:created", (options) => setSelectedObject(options.selected[0] || null));
    c.on("selection:updated", (options) => setSelectedObject(options.selected[0] || null));
    c.on("selection:cleared", () => setSelectedObject(null));
    c.on("object:modified", () => saveHistory());
    
    c.on("mouse:down", (opt) => {
      const evt = opt.e as any;
      // Start Dragging if Space is pressed or Alt is pressed or Middle Click
      if (spacePressed.current || evt.altKey || evt.button === 1 || !opt.target || (opt.target as any).isArtboard) {
        isPanning.current = true;
        c.selection = false;
        c.defaultCursor = "grabbing";
        lastX.current = evt.clientX || (evt.touches && evt.touches[0].clientX);
        lastY.current = evt.clientY || (evt.touches && evt.touches[0].clientY);
      }
    });

    c.on("mouse:move", (opt) => {
      if (isPanning.current) {
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
      isPanning.current = false; 
      c.selection = true;
      c.defaultCursor = spacePressed.current ? "grab" : "default";
      c.requestRenderAll();
    });

    c.on("mouse:wheel", (opt) => {
      if (!opt.e.ctrlKey && !opt.e.metaKey) return;
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

    // --- Shortcuts (Photoshop Styled) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") return;
      const activeObject = c.getActiveObject();
      const isEditing = (activeObject as any)?.isEditing;

      // Pan Tool (Spacebar)
      if (e.code === "Space" && !isEditing) {
        if (!spacePressed.current) {
          spacePressed.current = true;
          c.defaultCursor = "grab";
          c.requestRenderAll();
        }
        if (e.target === document.body) e.preventDefault();
      }

      if (isEditing) return;

      // V (Move), T (Text)
      if (e.key.toLowerCase() === "v") setActiveTab("select");
      if (e.key.toLowerCase() === "t") setActiveTab("text");

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const actives = c.getActiveObjects();
        const toDelete = actives.filter(obj => !(obj as any).isArtboard);
        if (toDelete.length > 0) {
          c.remove(...toDelete);
          c.discardActiveObject();
          c.requestRenderAll();
          saveHistory();
        }
      }

      // Ctrl Combinations
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c") { e.preventDefault(); copy(); }
        if (e.key === "v") { e.preventDefault(); paste(); }
        if (e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        if (e.key === "g") { e.preventDefault(); if (e.shiftKey) ungroupObjects(); else groupObjects(); }
        if (e.key === "a") { 
          e.preventDefault(); 
          const all = c.getObjects().filter(o => !(o as any).isArtboard);
          c.discardActiveObject();
          c.setActiveObject(new (FabricObject as any).ActiveSelection(all, { canvas: c }));
          c.requestRenderAll();
        }
        if (e.key === "0") { e.preventDefault(); autoFit(c); }
      }

      // Layer Order ([ / ])
      if (activeObject && !e.ctrlKey) {
        if (e.key === "[") {
          if (e.shiftKey) { // Move to Back (just above artboard)
            c.sendObjectToBack(activeObject);
            const artboard = c.getObjects().find(o => (o as any).isArtboard);
            if (artboard) c.sendObjectToBack(artboard);
          } else {
            const index = c.getObjects().indexOf(activeObject);
            const artboardIdx = c.getObjects().findIndex(o => (o as any).isArtboard);
            if (index > artboardIdx + 1) c.sendObjectBackwards(activeObject);
          }
          c.renderAll();
          saveHistory();
        }
        if (e.key === "]") {
          if (e.shiftKey) c.bringObjectToFront(activeObject);
          else c.bringObjectForward(activeObject);
          c.renderAll();
          saveHistory();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressed.current = false;
        c.defaultCursor = "default";
        c.requestRenderAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    const handleResize = () => {
      if (!c || !containerRef.current) return;
      c.setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      autoFit(c);
    };
    window.addEventListener("resize", handleResize);

    let isDisposed = false;

    // Force re-render when fonts are loaded to prevent blank text
    document.fonts.ready.then(() => {
      if (!isDisposed && c && c.getElement()) {
        try {
          c.requestRenderAll();
          c.getObjects().forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
              obj.set('dirty', true);
            }
          });
          c.renderAll();
        } catch (e) { /* Ignore render errors during mid-disposal */ }
      }
    });

    return () => {
      isDisposed = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      try {
        if (c) {
          c.dispose();
          setCanvas(null);
        }
      } catch (e) { console.error("Canvas dispose error:", e); }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentCanvas) return;
    const artboard = currentCanvas.getObjects().find(o => (o as any).isArtboard) as Rect;
    if (artboard) artboard.set({ width: canvasWidth, height: canvasHeight });
    currentCanvas.clipPath = new Rect({
      width: canvasWidth, height: canvasHeight,
      left: 0, top: 0, originX: "center", originY: "center",
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
      <div className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-2">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 shadow-2xl select-none flex items-center gap-4">
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
