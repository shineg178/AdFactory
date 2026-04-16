"use client";

import {
  Type,
  Image as ImageIcon,
  Shapes,
  Sparkles,
  Layers,
  MousePointer2,
  Hand,
  Settings,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";

export default function Sidebar() {
  const editor = useEditor();

  if (!editor) return null; // Safety check

  const { activeTab, setActiveTab } = editor;

  const tools: Array<{ id: string; icon: any; label: string; shortcut?: string; highlight?: boolean }> = [
    { id: "select", icon: MousePointer2, label: "선택", shortcut: "V" },
    { id: "text", icon: Type, label: "텍스트", shortcut: "T" },
    { id: "image", icon: ImageIcon, label: "이미지" },
    { id: "shape", icon: Shapes, label: "도형" },
    { id: "ai", icon: Sparkles, label: "AI 생성", highlight: true },
    { id: "layers", icon: Layers, label: "레이어" },
  ];

  return (
    <aside className="flex w-16 flex-col items-center border-r border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-950 z-20 shadow-sm">
      <div className="flex flex-1 flex-col gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ""}`}
            onClick={() => setActiveTab(tool.id as any)}
            className={cn(
              "group relative flex size-11 items-center justify-center rounded-xl transition-all duration-200",
              activeTab === tool.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md"
                : tool.highlight
                  ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <tool.icon className="size-5" />

            {/* Tooltip */}
            <div className="absolute left-14 hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-950 shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-1">
              {tool.label} {tool.shortcut && <span className="ml-2 text-[10px] opacity-50">{tool.shortcut}</span>}
            </div>
          </button>
        ))}
      </div>

      <button className="flex size-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <Settings className="size-5" />
      </button>
    </aside>
  );
}
