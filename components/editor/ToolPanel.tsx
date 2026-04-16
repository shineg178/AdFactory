"use client";

import { useEditor } from "./EditorContext";
import { Sparkles, Type, Image as ImageIcon, Plus, Wand2, Loader2, Check, AlertCircle, Shapes, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

interface AdCopy {
  mainHeadline: string;
  subHeadline: string;
  cta: string;
}

export default function ToolPanel() {
  const { activeTab, addText, addImage, addShape } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [target, setTarget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopies, setGeneratedCopies] = useState<AdCopy[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) addImage(result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateCopy = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, target }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const result = data.results || data.sets || [];
      setGeneratedCopies(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.message || "카피 생성 실패");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCopy = (copy: AdCopy) => {
    // All items are centered at (0,0) in our artboard system
    addText(copy.mainHeadline, { fontSize: 80, fontWeight: "bold", top: -150 });
    addText(copy.subHeadline, { fontSize: 32, fill: "#666666", top: 20 });
    addText(copy.cta, { fontSize: 24, backgroundColor: "#000000", fill: "#ffffff", padding: 20, top: 180 });
  };

  if (activeTab === "select") return null;

  return (
    <div className="w-80 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col z-10">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {activeTab === "text" && <><Type className="size-4" /> 텍스트 도구</>}
          {activeTab === "shape" && <><Shapes className="size-4" /> 도형</>}
          {activeTab === "image" && <><ImageIcon className="size-4" /> 이미지 에셋</>}
          {activeTab === "ai" && <><Sparkles className="size-4 text-indigo-500" /> AI 어시스턴트</>}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "text" && (
          <div className="space-y-4">
            <button onClick={() => addText("큰 제목 입력", { fontSize: 96, fontWeight: "bold" })} className="w-full flex-col p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-900 hover:border-indigo-500 transition-all text-left flex gap-1">
              <span className="text-xl font-bold">제목 추가</span>
              <span className="text-[10px] text-zinc-400 font-bold">Headline</span>
            </button>
            <button onClick={() => addText("설명 문구 입력", { fontSize: 42 })} className="w-full flex-col p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-900 hover:border-indigo-500 transition-all text-left flex gap-1">
              <span className="text-sm font-medium">본문 추가</span>
              <span className="text-[10px] text-zinc-400 font-bold">Body Text</span>
            </button>
          </div>
        )}

        {activeTab === "shape" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "rect", label: "사각형", icon: "w-10 h-10 border-2 border-zinc-400 rounded-sm" },
              { id: "circle", label: "원형", icon: "w-10 h-10 border-2 border-zinc-400 rounded-full" },
              { id: "triangle", label: "삼각형", icon: "w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-zinc-400" },
              { id: "star", label: "별형", icon: "text-zinc-400" }
            ].map((s) => (
              <button key={s.id} onClick={() => addShape(s.id)} className="p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-900 hover:border-indigo-500 transition-all flex flex-col items-center gap-3">
                <div className={cn("flex items-center justify-center", s.icon)}>
                   {s.id === "star" && <Plus className="size-6" />}
                </div>
                <span className="text-[11px] font-bold text-zinc-500">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <textarea 
                value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="제품의 주요 특징을 적어주세요..."
                className="w-full h-32 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <button 
                onClick={generateCopy} disabled={isGenerating || !aiPrompt}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 text-sm font-black shadow-lg shadow-indigo-500/20 transition-all"
              >
                {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                AI 광고 카피 생성
              </button>
            </div>
            <div className="space-y-2">
              {generatedCopies.map((copy, i) => (
                <div key={i} onClick={() => applyCopy(copy)} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500 bg-white dark:bg-zinc-900 cursor-pointer transition-all">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-tight">{i+1}. {copy.mainHeadline}</div>
                  <div className="text-[10px] text-zinc-500 line-clamp-1">{copy.subHeadline}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "image" && (
          <div className="space-y-4">
            <label className="w-full h-40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all">
              <Upload className="size-8 text-zinc-300" />
              <span className="text-xs font-bold text-zinc-400">내 이미지 업로드</span>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"].map((url, idx) => (
                <button key={idx} onClick={() => addImage(url)} className="aspect-square rounded-xl overflow-hidden border border-zinc-200">
                  <img src={url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
