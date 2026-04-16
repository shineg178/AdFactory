"use client";

import { useEditor } from "./EditorContext";
import { Sparkles, Type, Image as ImageIcon, Search, Upload, Plus, Wand2, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

interface AdCopy {
  mainHeadline: string;
  subHeadline: string;
  cta: string;
}

export default function ToolPanel() {
  const { activeTab, addText, addImage, canvas } = useEditor();
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
      if (result) {
        addImage(result);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
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
      
      // GPT-4o output handling
      const result = data.results || data.sets || [];
      setGeneratedCopies(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "카피 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCopy = (copy: AdCopy) => {
    if (!canvas) return;
    addText(copy.mainHeadline, { 
      left: 100, 
      top: 300, 
      fontSize: 56, 
      fontWeight: "bold",
      name: "main-headline" 
    });
    addText(copy.subHeadline, { 
      left: 100, 
      top: 420, 
      fontSize: 24, 
      fill: "#444444",
      name: "sub-headline" 
    });
    addText(copy.cta, { 
      left: 100, 
      top: 550, 
      fontSize: 20, 
      backgroundColor: "#000000", 
      fill: "#ffffff",
      padding: 15,
      rx: 5, ry: 5,
      name: "cta" 
    });
  };

  if (activeTab === "select") return null;

  return (
    <div className="w-80 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col animate-in fade-in slide-in-from-left-2 duration-200 z-10">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {activeTab === "text" && <><Type className="size-4" /> 텍스트 도구</>}
          {activeTab === "image" && <><ImageIcon className="size-4" /> 이미지 에셋</>}
          {activeTab === "ai" && <><Sparkles className="size-4 text-indigo-500" /> AI 어시스턴트</>}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "text" && (
          <div className="space-y-4">
            <button 
              onClick={() => addText("제목을 입력하세요", { fontSize: 64, fontWeight: "bold" })}
              className="w-full flex flex-col items-start gap-1 p-3 rounded-lg border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:bg-indigo-500/10 transition-all text-left group"
            >
              <span className="text-lg font-bold group-hover:text-indigo-600">제목 추가</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-wider">큰 굵은 텍스트</span>
            </button>
            <button 
              onClick={() => addText("본문 내용을 입력하세요", { fontSize: 32, fontWeight: "semibold" })}
              className="w-full flex flex-col items-start gap-1 p-3 rounded-lg border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:bg-indigo-500/10 transition-all text-left group"
            >
              <span className="text-sm font-semibold group-hover:text-indigo-600">소제목 추가</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-wider">중간 크기 텍스트</span>
            </button>
            <button 
              onClick={() => addText("상세 설명 문구입니다.", { fontSize: 18 })}
              className="w-full flex flex-col items-start gap-1 p-3 rounded-lg border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:bg-indigo-500/10 transition-all text-left group"
            >
              <span className="text-xs group-hover:text-indigo-600">내용 추가</span>
              <span className="text-[10px] text-zinc-400 font-bold tracking-wider">일반 본문 텍스트</span>
            </button>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">제품 설명</label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="광고 하려는 제품의 특징을 적어주세요."
                  className="w-full h-28 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">타겟 고객</label>
                <input 
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="예: 20대 대학생, 바쁜 직장인"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                />
              </div>

              <button 
                onClick={generateCopy}
                disabled={isGenerating || !aiPrompt}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {isGenerating ? "생성 중..." : "AI 광고 카피 생성"}
              </button>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-xs">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {generatedCopies.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">생성된 시안</label>
                {generatedCopies.map((copy, i) => (
                  <div 
                    key={i}
                    onClick={() => applyCopy(copy)}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-900 cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-indigo-600 text-white rounded-full p-1">
                        <Check className="size-3" />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-relaxed">{copy.mainHeadline}</div>
                    <div className="text-[10px] text-zinc-500 line-clamp-2">{copy.subHeadline}</div>
                  </div>
                ))}
              </div>
            )}

            {!generatedCopies.length && !isGenerating && (
              <div className="p-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
                 <div className="size-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                   <Wand2 className="size-5 text-indigo-400" />
                 </div>
                 <p className="text-xs text-zinc-400 leading-relaxed">
                   제품 정보를 입력하면 AI가 최적의 문구를 제안해줍니다.
                 </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "image" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label 
                className="col-span-2 h-32 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 cursor-pointer transition-all group"
              >
                <div className="size-10 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="size-5 text-zinc-400 group-hover:text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">이미지 업로드</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden" 
                />
              </label>
              
              <button 
                onClick={() => addImage("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80")}
                className="aspect-square rounded-xl bg-zinc-100 overflow-hidden relative group border border-zinc-200 dark:border-zinc-800 lg:hover:ring-2 ring-indigo-500"
              >
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Plus className="size-5 text-white" />
                </div>
              </button>
              
              <button 
                onClick={() => addImage("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80")}
                className="aspect-square rounded-xl bg-zinc-100 overflow-hidden relative group border border-zinc-200 dark:border-zinc-800 lg:hover:ring-2 ring-indigo-500"
              >
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Plus className="size-5 text-white" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
