"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, Point, Textbox, FabricObject, Rect, Shadow, FabricImage } from "fabric";
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

  // Sync the physical artboard rectangle to logical canvas dimension changes
  useEffect(() => {
    if (!currentCanvas) return;
    const artboard = currentCanvas.getObjects().find((o: any) => o.isArtboard);
    if (artboard) {
      artboard.set({ width: canvasWidth, height: canvasHeight });
      currentCanvas.requestRenderAll();
    }
  }, [canvasWidth, canvasHeight, currentCanvas]);

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

    // Helper: enforce artboard cannot be selected/moved/deleted under any circumstances
    const lockArtboard = () => {
      const ab = c.getObjects().find((o: any) => o.isArtboard);
      if (ab) {
        ab.set({
          selectable: false, evented: false, hoverCursor: "default",
          lockMovementX: true, lockMovementY: true,
          lockScalingX: true, lockScalingY: true, lockRotation: true,
          hasControls: false, hasBorders: false,
        });
        c.sendObjectToBack(ab);
      }
    };

    // Events
    c.on("selection:created", (options) => {
      const obj = options.selected?.[0];
      if ((obj as any)?.isArtboard) { c.discardActiveObject(); c.requestRenderAll(); return; }
      setSelectedObject(obj || null);
    });
    c.on("selection:updated", (options) => {
      const obj = options.selected?.[0];
      if ((obj as any)?.isArtboard) { c.discardActiveObject(); c.requestRenderAll(); return; }
      setSelectedObject(obj || null);
    });
    c.on("selection:cleared", () => setSelectedObject(null));
    c.on("object:modified", () => { lockArtboard(); saveHistory(); });
    c.on("object:added", lockArtboard);
    
    c.on("mouse:down", (opt) => {
      const evt = opt.e as any;
      // Start Dragging if Space/Alt/Middle mouse is pressed, OR clicked on empty background
      if (spacePressed.current || evt.altKey || evt.button === 1 || !opt.target) {
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

    c.on("mouse:dblclick", (opt) => {
      const target = opt.target as any;
      if (target && target.isPlaceholder && target.placeholderType === "image") {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            FabricImage.fromURL(url).then((img: any) => {
              const targetWidth = target.width * target.scaleX;
              const targetHeight = target.height * target.scaleY;
              const scaleX = targetWidth / img.width!;
              const scaleY = targetHeight / img.height!;
              const activeScale = Math.min(scaleX, scaleY); // object-fit: contain logic
              
              img.set({
                originX: "center", originY: "center",
                left: target.left, top: target.top,
                angle: target.angle,
                scaleX: activeScale, scaleY: activeScale,
                isPlaceholder: true,
                placeholderType: "image",
                placeholderLabel: target.placeholderLabel,
                clipPath: target.clipPath
              });
              
              c.add(img);
              c.remove(target);
              c.setActiveObject(img);
              c.renderAll();
              saveHistory();
            });
          };
          reader.readAsDataURL(file);
        };
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.click();
        setTimeout(() => document.body.removeChild(fileInput), 1000); // Cleanup later
      }
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

      // --- Text formatting (Ctrl+B/I/U) — works even during text editing (Photoshop) ---
      if ((e.ctrlKey || e.metaKey) && activeObject) {
        const isTextObj = activeObject.type === "textbox" || activeObject.type === "i-text" || activeObject.type === "text";
        if (isTextObj) {
          if (e.key === "b") { e.preventDefault(); (activeObject as any).set("fontWeight", (activeObject as any).fontWeight === "bold" ? "normal" : "bold"); c.requestRenderAll(); saveHistory(); return; }
          if (e.key === "i") { e.preventDefault(); (activeObject as any).set("fontStyle", (activeObject as any).fontStyle === "italic" ? "normal" : "italic"); c.requestRenderAll(); saveHistory(); return; }
          if (e.key === "u") { e.preventDefault(); (activeObject as any).set("underline", !(activeObject as any).underline); c.requestRenderAll(); saveHistory(); return; }
        }
      }

      if (isEditing) return;

      // --- Escape: Deselect & close panel ---
      if (e.key === "Escape") {
        c.discardActiveObject();
        c.renderAll();
        setActiveTab("select");
      }

      // --- Tool shortcuts (no modifiers held) ---
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === "v") setActiveTab("select");
        if (e.key.toLowerCase() === "t") setActiveTab("text");
        if (e.key.toLowerCase() === "u") setActiveTab("shape");

        // Arrow nudge: 1px / Shift+Arrow: 10px (Photoshop)
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && activeObject && !(activeObject as any).isArtboard) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowUp") activeObject.set("top", (activeObject.top || 0) - step);
          if (e.key === "ArrowDown") activeObject.set("top", (activeObject.top || 0) + step);
          if (e.key === "ArrowLeft") activeObject.set("left", (activeObject.left || 0) - step);
          if (e.key === "ArrowRight") activeObject.set("left", (activeObject.left || 0) + step);
          activeObject.setCoords();
          c.renderAll();
          saveHistory();
        }

        // Number keys 0-9: Set opacity (PS: 1→10%, 2→20%, … 9→90%, 0→100%)
        if (e.key >= "0" && e.key <= "9" && activeObject && !(activeObject as any).isArtboard) {
          activeObject.set("opacity", e.key === "0" ? 1 : parseInt(e.key) / 10);
          c.renderAll();
          saveHistory();
        }
      }

      // --- Delete / Backspace ---
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

      // --- Ctrl / Cmd combinations ---
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c") { e.preventDefault(); copy(); }
        if (e.key === "v") { e.preventDefault(); paste(); }
        if (e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        if (e.key === "g") { e.preventDefault(); if (e.shiftKey) ungroupObjects(); else groupObjects(); }
        if (e.key === "a") {
          e.preventDefault();
          const all = c.getObjects().filter(o => !(o as any).isArtboard);
          c.discardActiveObject();
          if (all.length > 0) c.setActiveObject(new (FabricObject as any).ActiveSelection(all, { canvas: c }));
          c.requestRenderAll();
        }

        // Ctrl+0 = Fit to screen (Photoshop)
        if (e.key === "0") { e.preventDefault(); autoFit(c); }

        // Ctrl+1 = 100% zoom (Photoshop)
        if (e.key === "1") {
          e.preventDefault();
          c.setZoom(1);
          setZoom(1);
          const vpt = c.viewportTransform;
          if (containerRef.current) { vpt[4] = containerRef.current.clientWidth / 2; vpt[5] = containerRef.current.clientHeight / 2; }
          c.requestRenderAll();
        }

        // Ctrl+D = Deselect (Photoshop)
        if (e.key === "d") {
          e.preventDefault();
          c.discardActiveObject();
          c.renderAll();
        }

        // Ctrl+J = Duplicate layer (Photoshop)
        if (e.key === "j" && activeObject && !(activeObject as any).isArtboard) {
          e.preventDefault();
          activeObject.clone().then((cloned: any) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            c.add(cloned);
            c.setActiveObject(cloned);
            c.renderAll();
            saveHistory();
          });
        }

        // Ctrl+= / Ctrl++ = Zoom in
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          const nz = Math.min(c.getZoom() * 1.2, 20);
          c.zoomToPoint(new Point(c.width / 2, c.height / 2), nz);
          setZoom(nz);
        }

        // Ctrl+- = Zoom out
        if (e.key === "-") {
          e.preventDefault();
          const nz = Math.max(c.getZoom() / 1.2, 0.01);
          c.zoomToPoint(new Point(c.width / 2, c.height / 2), nz);
          setZoom(nz);
        }
      }

      // --- Layer Order ([ / ]) ---
      if (activeObject && !(activeObject as any).isArtboard && !e.ctrlKey && !e.metaKey) {
        if (e.key === "[") {
          if (e.shiftKey) {
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
