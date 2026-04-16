"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ToolPanel from "./ToolPanel";
import Canvas from "./Canvas";
import Properties from "./Properties";
import { EditorProvider } from "./EditorContext";

export default function Editor() {
  return (
    <EditorProvider>
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black overflow-hidden font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ToolPanel />
          <Canvas />
          <Properties />
        </div>
      </div>
    </EditorProvider>
  );
}
