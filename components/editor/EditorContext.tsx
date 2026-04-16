"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import * as fabric from "fabric";

type TabType = "select" | "text" | "image" | "shape" | "ai" | "layers";

interface EditorContextType {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;
  selectedObject: fabric.FabricObject | null;
  setSelectedObject: (obj: fabric.FabricObject | null) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  addText: (text: string, options?: any) => void;
  addImage: (url: string) => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("select");
  const [zoom, setZoom] = useState(1);
  
  // Basic History State
  const history = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const saveHistory = useCallback(() => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toDatalessJSON());
    if (history.current[history.current.length - 1] === json) return;
    
    history.current.push(json);
    if (history.current.length > 50) history.current.shift();
    redoStack.current = []; // Clear redo on new action
  }, [canvas]);

  const undo = useCallback(() => {
    if (!canvas || history.current.length <= 1) return;
    
    const current = history.current.pop();
    if (current) redoStack.current.push(current);
    
    const last = history.current[history.current.length - 1];
    if (last) {
      canvas.loadFromJSON(last).then(() => canvas.renderAll());
    }
  }, [canvas]);

  const redo = useCallback(() => {
    if (!canvas || redoStack.current.length === 0) return;
    
    const next = redoStack.current.pop();
    if (next) {
      history.current.push(next);
      canvas.loadFromJSON(next).then(() => canvas.renderAll());
    }
  }, [canvas]);

  const addText = useCallback((text: string, options = {}) => {
    if (!canvas) return;
    // Use Textbox for editable text in Fabric v7
    const fabricText = new fabric.Textbox(text, {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: "#000000",
      width: 200, // Textbox needs a width
      cornerColor: "#4f46e5",
      cornerStyle: "circle",
      transparentCorners: false,
      ...options
    });
    canvas.add(fabricText);
    canvas.setActiveObject(fabricText);
    canvas.renderAll();
    saveHistory();
  }, [canvas, saveHistory]);

  const addImage = useCallback((url: string) => {
    if (!canvas) return;
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const maxWidth = 400;
      if (img.width > maxWidth) {
        img.scale(maxWidth / img.width);
      }
      
      img.set({
        left: 200,
        top: 200,
        cornerColor: "#4f46e5",
        cornerStyle: "circle",
        transparentCorners: false,
      });
      
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.centerObject(img);
      canvas.renderAll();
      saveHistory();
    });
  }, [canvas, saveHistory]);

  return (
    <EditorContext.Provider 
      value={{ 
        canvas, 
        setCanvas, 
        selectedObject, 
        setSelectedObject,
        activeTab,
        setActiveTab,
        zoom,
        setZoom,
        addText,
        addImage,
        undo,
        redo,
        saveHistory
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
