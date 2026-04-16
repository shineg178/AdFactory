"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { Canvas, FabricObject, Textbox, FabricImage, Rect, Circle, Triangle, Polygon } from "fabric";

type TabType = "select" | "text" | "image" | "shape" | "ai" | "layers";

interface CustomFont {
  name: string;
  family: string;
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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvas, _setCanvas] = useState<Canvas | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  
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
  
  const history = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const setCanvas = useCallback((c: Canvas | null) => {
    canvasRef.current = c;
    _setCanvas(c);
  }, []);

  const addCustomFont = useCallback((name: string, family: string) => {
    setCustomFonts(prev => [...prev, { name, family }]);
  }, []);

  const saveHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const json = JSON.stringify(c.toJSON());
      if (history.current[history.current.length - 1] === json) return;
      history.current.push(json);
      if (history.current.length > 50) history.current.shift();
      redoStack.current = []; 
    } catch (e) {
      console.error("History Save Error:", e);
    }
  }, []);

  // Center Item at global (0,0) for Artboard system
  const centerItem = useCallback((obj: FabricObject) => {
    obj.set({
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0
    });
  }, []);

  const addText = useCallback((text: string, options = {}) => {
    const c = canvasRef.current;
    if (!c) return;
    const fabricText = new Textbox(text, {
      fontSize: 80, 
      fill: "#111111", 
      width: 600, 
      fontFamily: "Pretendard",
      cornerColor: "#4f46e5", 
      cornerStyle: "circle", 
      transparentCorners: false,
      textAlign: "center",
      ...options
    });
    
    fabricText.setControlsVisibility({
      mt: true, mb: true, ml: true, mr: true,
      tl: true, tr: true, bl: true, br: true
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
      img.set({ cornerColor: "#4f46e5", cornerStyle: "circle", transparentCorners: false });
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
    const common = { fill: "#4f46e5", ...options };

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

  const undo = useCallback(() => {
    const c = canvasRef.current;
    if (!c || history.current.length <= 1) return;
    const current = history.current.pop();
    if (current) redoStack.current.push(current);
    const last = history.current[history.current.length - 1];
    if (last) c.loadFromJSON(last).then(() => c.renderAll());
  }, []);

  const redo = useCallback(() => {
    const c = canvasRef.current;
    if (!c || redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    if (next) {
      history.current.push(next);
      c.loadFromJSON(next).then(() => c.renderAll());
    }
  }, []);

  return (
    <EditorContext.Provider 
      value={{ 
        canvas, setCanvas, selectedObject, setSelectedObject, activeTab, setActiveTab,
        zoom, setZoom, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight,
        customFonts, addCustomFont,
        addText, addImage, addShape, undo, redo, saveHistory
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) throw new Error("useEditor must be used within an EditorProvider");
  return context;
}
