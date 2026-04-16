"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useMemo, useEffect } from "react";
import { Canvas, FabricObject, Textbox, FabricImage, Rect, Circle, Triangle, Polygon, Group, Shadow } from "fabric";

type TabType = "select" | "text" | "image" | "shape" | "ai" | "layers" | "templates";

export interface TemplateInfo {
  id: string;
  name: string;
  data: string;
}

interface CustomFont {
  name: string;
  family: string;
  postscriptName?: string;
  fullName?: string;
}

interface EditorContextType {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas | null) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  canvasWidth: number;
  setCanvasWidth: (w: number) => void;
  canvasHeight: number;
  setCanvasHeight: (h: number) => void;
  customFonts: CustomFont[];
  addCustomFont: (name: string, family: string) => void;
  addText: (text: string, options?: any) => void;
  addImage: (url: string) => void;
  addShape: (type: string, options?: any) => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  copy: () => void;
  paste: () => void;
  groupObjects: () => void;
  ungroupObjects: () => void;
  alignObject: (type: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  loadSystemFonts: () => Promise<void>;
  resetDesign: () => void;
  setArtboardColor: (color: string) => void;
  templates: TemplateInfo[];
  addPlaceholder: (type: "image" | "title" | "description", label: string) => void;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvas, _setCanvas] = useState<Canvas | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const clipboard = useRef<FabricObject | null>(null);

  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("select");
  const [zoom, setZoom] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1080);

  const [customFonts, setCustomFonts] = useState<CustomFont[]>([
    { name: "Pretendard", family: "Pretendard, -apple-system, sans-serif" },
    { name: "Gmarket Sans", family: "GmarketSansMedium, sans-serif" },
    { name: "나눔고딕", family: "Nanum Gothic, sans-serif" },
  ]);

  const [templates, setTemplates] = useState<TemplateInfo[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ad-factory-templates");
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  const history = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const setCanvas = useCallback((c: Canvas | null) => {
    canvasRef.current = c;
    _setCanvas(c);
  }, []);

  const saveHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      // Must include 'isArtboard' custom property in serialization
      const json = JSON.stringify((c as any).toJSON(['isArtboard']));
      if (history.current[history.current.length - 1] === json) return;
      history.current.push(json);
      if (history.current.length > 50) history.current.shift();
      redoStack.current = [];
      localStorage.setItem("ad-factory-last-design", json);
      localStorage.setItem("ad-factory-canvas-config", JSON.stringify({ canvasWidth, canvasHeight }));
    } catch (e) { console.error(e); }
  }, [canvasWidth, canvasHeight]);

  const centerItem = useCallback((obj: FabricObject) => {
    obj.set({ originX: 'center', originY: 'center', left: 0, top: 0 });
  }, []);

  const addText = useCallback((text: string, options = {}) => {
    const c = canvasRef.current;
    if (!c) return;
    const fabricText = new Textbox(text, {
      fontSize: 80, fill: "#111111", width: 600,
      fontFamily: "Pretendard", textAlign: "center",
      cornerColor: "#6366f1", cornerStyle: "circle", transparentCorners: false,
      ...options
    });
    centerItem(fabricText);
    c.add(fabricText);
    c.setActiveObject(fabricText);
    c.renderAll();
    saveHistory();
  }, [saveHistory, centerItem]);

  const addImage = useCallback((url: string) => {
    const c = canvasRef.current;
    if (!c) return;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const maxWidth = 800;
      if (img.width > maxWidth) img.scale(maxWidth / img.width);
      centerItem(img);
      c.add(img);
      c.setActiveObject(img);
      c.renderAll();
      saveHistory();
    });
  }, [saveHistory, centerItem]);

  const addShape = useCallback((type: string, options = {}) => {
    const c = canvasRef.current;
    if (!c) return;
    let shape: FabricObject;
    const common = { fill: "#6366f1", ...options };
    switch (type) {
      case "rect": shape = new Rect({ ...common, width: 300, height: 300, rx: 10, ry: 10 }); break;
      case "circle": shape = new Circle({ ...common, radius: 150 }); break;
      case "triangle": shape = new Triangle({ ...common, width: 300, height: 300 }); break;
      case "star":
        shape = new Polygon([
          { x: 100, y: 10 }, { x: 40, y: 198 }, { x: 190, y: 78 }, { x: 10, y: 78 }, { x: 160, y: 198 }
        ], { ...common });
        break;
      default: return;
    }
    centerItem(shape);
    c.add(shape);
    c.setActiveObject(shape);
    c.renderAll();
    saveHistory();
  }, [saveHistory, centerItem]);

  const addPlaceholder = useCallback((type: "image" | "title" | "description", label: string) => {
    const c = canvasRef.current;
    if (!c) return;

    let placeholder: FabricObject;
    if (type === "image") {
      placeholder = new Rect({ width: 300, height: 300, fill: "#e4e4e7", stroke: "#a1a1aa", strokeWidth: 2, strokeDashArray: [10, 5], rx: 10, ry: 10 });
    } else {
      placeholder = new Textbox(label, { fontSize: type === "title" ? 60 : 30, fontWeight: type === "title" ? "bold" : "normal", fill: "#a1a1aa", width: 400, fontFamily: "Pretendard", textAlign: "center" });
    }

    (placeholder as any).isPlaceholder = true;
    (placeholder as any).placeholderType = type;
    (placeholder as any).placeholderLabel = label;

    centerItem(placeholder);
    c.add(placeholder);
    c.setActiveObject(placeholder);
    c.renderAll();
    saveHistory();
  }, [centerItem, saveHistory]);

  const saveTemplate = useCallback((name: string) => {
    const c = canvasRef.current;
    if (!c) return;
    const data = JSON.stringify((c as any).toJSON(['isArtboard', 'isPlaceholder', 'placeholderType', 'placeholderLabel']));
    const newTemplate = { id: Date.now().toString(), name, data };

    setTemplates(prev => {
      const updated = [...prev, newTemplate];
      localStorage.setItem("ad-factory-templates", JSON.stringify(updated));
      return updated;
    });
    alert(`템플릿 '${name}'이(가) 저장되었습니다!`);
  }, []);

  const loadTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template || !canvasRef.current) return;
    if (!window.confirm(`템플릿 '${template.name}'을(를) 불러오시겠습니까? 현재 디자인은 지워집니다.`)) return;

    const c = canvasRef.current;
    c.loadFromJSON(template.data).then(() => {
      c.getObjects().forEach(obj => {
        const isArtboard = (obj as any).isArtboard;
        const isPlaceholder = (obj as any).isPlaceholder;

        if (isArtboard) {
          obj.set({ selectable: false, evented: false, lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false });
          c.sendObjectToBack(obj);
        } else if (!isPlaceholder) {
          obj.set({ selectable: false, evented: false, lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false });
        }
        // If it's a placeholder, it remains fully editable.
      });
      c.renderAll();
      history.current = [template.data];
      redoStack.current = [];
      localStorage.setItem("ad-factory-last-design", template.data);
    });
  }, [templates]);

  const addCustomFont = useCallback((name: string, family: string) => {
    setCustomFonts(prev => {
      if (prev.find(p => p.name === name)) return prev;
      return [...prev, { name, family }];
    });
  }, []);

  const loadSystemFonts = useCallback(async () => {
    if (!('queryLocalFonts' in window)) {
      alert("이 브라우저는 시스템 폰트 연동을 지원하지 않습니다. 최신 크롬/엣지를 사용해 주세요.");
      return;
    }
    try {
      // @ts-ignore
      const localFonts = await window.queryLocalFonts();
      const fontMap = new Map<string, CustomFont>();

      localFonts.forEach((f: any) => {
        const cssName = f.fullName || f.family;
        if (!fontMap.has(cssName)) {
          fontMap.set(cssName, {
            name: f.fullName || f.family,
            family: cssName,
            fullName: f.fullName,
            postscriptName: f.postscriptName
          });
        }
      });

      const systemFontList = Array.from(fontMap.values());
      setCustomFonts(prev => {
        const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
        const fresh = systemFontList.filter(f => !existingNames.has(f.name.toLowerCase()));
        return [...prev, ...fresh];
      });
      alert(`${systemFontList.length}개의 시스템 폰트를 불러왔습니다!`);
    } catch (e) {
      alert("시스템 폰트 접근 권한이 필요합니다.");
    }
  }, []);

  const copy = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (active && !(active as any).isArtboard) {
      const cloned = await active.clone();
      clipboard.current = cloned;
    }
  }, []);

  const paste = useCallback(async () => {
    const c = canvasRef.current;
    if (!c || !clipboard.current) return;
    const cloned = await clipboard.current.clone();
    c.discardActiveObject();
    cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20, evented: true });
    if (cloned instanceof Group) {
      cloned.canvas = c;
      cloned.forEachObject((obj) => c.add(obj));
      cloned.setCoords();
    }
    c.add(cloned);
    c.setActiveObject(cloned);
    c.renderAll();
    saveHistory();
  }, [saveHistory]);

  const groupObjects = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    (active as any).toGroup();
    c.renderAll();
    saveHistory();
  }, [saveHistory]);

  const ungroupObjects = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active || active.type !== 'group') return;
    (active as any).toActiveSelection();
    c.renderAll();
    saveHistory();
  }, [saveHistory]);

  const alignObject = useCallback((type: string) => {
    const c = canvasRef.current;
    const obj = selectedObject;
    if (!c || !obj) return;
    const bounds = { left: -canvasWidth / 2, top: -canvasHeight / 2, right: canvasWidth / 2, bottom: canvasHeight / 2 };
    switch (type) {
      case "left": obj.set("left", bounds.left + (obj.width * obj.scaleX) / 2); break;
      case "center": obj.set("left", 0); break;
      case "right": obj.set("left", bounds.right - (obj.width * obj.scaleX) / 2); break;
      case "top": obj.set("top", bounds.top + (obj.height * obj.scaleY) / 2); break;
      case "middle": obj.set("top", 0); break;
      case "bottom": obj.set("top", bounds.bottom - (obj.height * obj.scaleY) / 2); break;
    }
    obj.setCoords();
    c.renderAll();
    saveHistory();
  }, [selectedObject, canvasWidth, canvasHeight, saveHistory]);

  const setArtboardColor = useCallback((color: string) => {
    const c = canvasRef.current;
    if (!c) return;
    const artboard = c.getObjects().find(o => (o as any).isArtboard);
    if (artboard) {
      artboard.set("fill", color);
      c.renderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const resetDesign = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !window.confirm("정말로 모든 디자인을 삭제하고 초기화하시겠습니까?")) return;

    // Remove everything EXCEPT the artboard
    c.getObjects().forEach(obj => {
      if (!(obj as any).isArtboard) {
        c.remove(obj);
      }
    });

    // Check if artboard still exists, if not, recreate it
    let artboard = c.getObjects().find(o => (o as any).isArtboard);
    if (!artboard) {
      artboard = new Rect({
        width: canvasWidth, height: canvasHeight,
        left: 0, top: 0, originX: "center", originY: "center",
        fill: "#ffffff", selectable: false, evented: false,
        lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true,
        hasControls: false, hasBorders: false,
        shadow: new Shadow({ color: "rgba(0,0,0,0.8)", blur: 50, offsetX: 0, offsetY: 0 })
      });
      (artboard as any).isArtboard = true;
      c.add(artboard);
      c.sendObjectToBack(artboard);
    }

    history.current = [];
    redoStack.current = [];
    localStorage.removeItem("ad-factory-last-design");
    saveHistory();
    c.renderAll();
  }, [saveHistory, canvasWidth, canvasHeight]);

  const undo = useCallback(() => {
    const c = canvasRef.current;
    if (!c || history.current.length <= 1) return;
    const current = history.current.pop();
    if (current) redoStack.current.push(current);
    const last = history.current[history.current.length - 1];
    if (last) c.loadFromJSON(last).then(() => {
      const artboard = c.getObjects().find(o => (o as any).isArtboard);
      if (artboard) {
        artboard.set({
          selectable: false, evented: false, lockMovementX: true, lockMovementY: true,
          lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, hasBorders: false
        });
        c.sendObjectToBack(artboard);
      }
      c.renderAll();
    });
  }, []);

  const redo = useCallback(() => {
    const c = canvasRef.current;
    if (!c || redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    if (next) {
      history.current.push(next);
      c.loadFromJSON(next).then(() => {
        const artboard = c.getObjects().find(o => (o as any).isArtboard);
        if (artboard) {
          artboard.set({
            selectable: false, evented: false, lockMovementX: true, lockMovementY: true,
            lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, hasBorders: false
          });
          c.sendObjectToBack(artboard);
        }
        c.renderAll();
      });
    }
  }, []);

  const contextValue = useMemo(() => ({
    canvas, setCanvas, selectedObject, setSelectedObject, activeTab, setActiveTab,
    zoom, setZoom, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight,
    customFonts, addCustomFont, addText, addImage, addShape, undo, redo, saveHistory,
    copy, paste, groupObjects, ungroupObjects, alignObject, loadSystemFonts, resetDesign,
    setArtboardColor, templates, addPlaceholder, saveTemplate, loadTemplate
  }), [
    canvas, setCanvas, selectedObject, activeTab, zoom, canvasWidth, canvasHeight,
    customFonts, addCustomFont, addText, addImage, addShape, undo, redo, saveHistory, copy, paste,
    groupObjects, ungroupObjects, alignObject, loadSystemFonts, resetDesign,
    setArtboardColor, templates, addPlaceholder, saveTemplate, loadTemplate
  ]);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) throw new Error("useEditor must be used within an EditorProvider");
  return context;
}
