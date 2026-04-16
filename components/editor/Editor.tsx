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
      <div className="flex h-screen flex-col bg-zinc-950 dark:bg-black overflow-hidden font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          {/* Static Left Sidebar */}
          <Sidebar />
          
          {/* Main workspace area that holds floating ToolPanel and Canvas */}
          <main className="flex-1 relative flex overflow-hidden">
            {/* 
              Floating Tool Panel 
              It overlays the canvas without pushing it.
            */}
            <ToolPanel />
            
            {/* Full Space Canvas */}
            <Canvas />
          </main>

          {/* Right Sidebar - usually stay fixed or could be floating too. 
              Keeping it fixed for now as it's standard for properties. */}
          <Properties />
        </div>
      </div>
    </EditorProvider>
  );
}
