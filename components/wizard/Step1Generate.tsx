"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronRight, RotateCcw } from "lucide-react";
import { useWizard, AdCopy } from "./WizardContext";
import { cn } from "@/lib/utils";

// 레이아웃 패턴별 색상
const LAYOUT_COLORS: Record<string, string> = {
  "메인-버튼": "bg-amber-100 text-amber-700",
  "메인-서브-버튼": "bg-blue-100 text-blue-700",
  "서브-메인-버튼": "bg-purple-100 text-purple-700",
};

export default function Step1Generate() {
  const {
    setCopies, copies,
    setSelectedCopy, selectedIndex, setSelectedIndex,
    setStep,
    productInfo, setProductInfo,
    targets, setTargets,
    conditions, setConditions,
  } = useWizard();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!productInfo.trim()) return;
    setIsGenerating(true);
    setError(null);
    setCopies([]);
    setSelectedIndex(null);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productInfo, targets, conditions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCopies(data.results || []);
    } catch (e: any) {
      setError(e.message || "카피 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedCopy(copies[selectedIndex]);
    setStep(2);
  };

  return (
    <div className="flex gap-8 w-full max-w-7xl mx-auto">

      {/* ── 좌측: 입력 패널 ── */}
      <div className="w-96 shrink-0 space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="size-3" /> Step 1
          </div>
          <h2 className="text-2xl font-black text-zinc-900">GFA 배너 카피 생성</h2>
          <p className="text-sm text-zinc-500">제품 정보·타겟·조건 입력 → AI가 CTR 최적화 시안 10개를 만들어드립니다.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">
            제품 정보 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder={"제품명, 핵심 기능, 가격, 혜택, 이벤트 등\n\n예) HNF 러닝 선글라스 / 0.1초 자동 변색 렌즈 / 29g 초경량 / 38,900원 / 30% 페이백 / 사은품 4종 / 4차 전량 품절·5차 예약 중"}
            className="w-full h-48 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">타겟</label>
          <textarea
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            placeholder={"타겟 그룹을 번호로 나열\n\n예)\n1. 35~59세 남성 마라톤·조깅 러너\n2. 햇빛·눈부심을 싫어하는 실전형 러너\n3. 자외선에 예민한 남성 러너"}
            className="w-full h-36 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">중요 조건</label>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder={"강조 소구점, 시즌 이슈, 금지 표현 등\n\n예) 여름·자외선·변색 강조 / 4차 품절 긴급성 / 버튼에 가격+혜택+긴급감 필수"}
            className="w-full h-32 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={generate}
          disabled={isGenerating || !productInfo.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 text-sm font-black shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? "시안 생성 중..." : copies.length > 0 ? "다시 생성" : "AI 카피 시안 생성"}
        </button>

        {/* 다음 버튼 — 결과 있을 때만 */}
        {copies.length > 0 && (
          <button
            onClick={handleNext}
            disabled={selectedIndex === null}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98]"
          >
            {selectedIndex === null ? "시안을 선택하세요" : "스타일 설정하기"} <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* ── 우측: 결과 그리드 ── */}
      <div className="flex-1 min-w-0">
        {!copies.length && !isGenerating && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-zinc-300 select-none">
            <Sparkles className="size-12 opacity-30" />
            <p className="text-sm font-bold">좌측에 정보를 입력하고<br />AI 카피 시안을 생성하세요</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-400">
            <Loader2 className="size-10 animate-spin text-indigo-400" />
            <p className="text-sm font-bold">AI가 시안을 생성하고 있습니다...</p>
          </div>
        )}

        {copies.length > 0 && !isGenerating && (
          <div className="space-y-4">
            {/* 범례 + 재생성 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mr-1">구성</span>
                {Object.entries(LAYOUT_COLORS).map(([label, cls]) => (
                  <span key={label} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cls)}>{label}</span>
                ))}
              </div>
              <button
                onClick={generate}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-indigo-600 disabled:opacity-50 transition-colors shrink-0"
              >
                <RotateCcw className="size-3" /> 재생성
              </button>
            </div>

            {/* 2×5 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {copies.map((copy, i) => (
                <CopyCard
                  key={i}
                  copy={copy}
                  index={i}
                  selected={selectedIndex === i}
                  onSelect={() => setSelectedIndex(i)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function CopyCard({ copy, index, selected, onSelect }: {
  copy: AdCopy;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const layoutColor = LAYOUT_COLORS[copy.layout] || "bg-zinc-100 text-zinc-500";

  const parts = (copy.layout || "메인-서브-버튼")
    .split("-")
    .map((p) => p.trim());

  // layout 순서대로 렌더
  const elements: React.ReactNode[] = parts.map((p) => {
    const lower = p.toLowerCase();
    if (lower === "메인") return (
      <div key="main" className="font-black text-zinc-900 text-sm leading-snug">{copy.mainHeadline}</div>
    );
    if (lower === "서브" && copy.subHeadline) return (
      <div key="sub" className="text-xs text-zinc-500 leading-snug">{copy.subHeadline}</div>
    );
    if (lower === "버튼" && copy.cta) return (
      <div key="cta">
        <span className="inline-block bg-zinc-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full leading-snug">{copy.cta}</span>
      </div>
    );
    return null;
  }).filter(Boolean);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-3",
        selected
          ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10"
          : "border-zinc-100 bg-white hover:border-indigo-300 hover:shadow-sm"
      )}
    >
      {/* 헤더: 번호 + 타겟 + 레이아웃 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-[10px] font-black text-zinc-300">#{index + 1}</span>
          {copy.targetLabel && (
            <span className="text-[10px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full truncate max-w-30">
              {copy.targetLabel}
            </span>
          )}
          {copy.layout && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", layoutColor)}>
              {copy.layout}
            </span>
          )}
        </div>
        <div className={cn(
          "size-4 rounded-full border-2 shrink-0 mt-0.5 transition-all",
          selected ? "border-indigo-500 bg-indigo-500" : "border-zinc-300"
        )} />
      </div>

      {/* 카피 본문 */}
      <div className="space-y-1.5">
        {elements}
      </div>
    </button>
  );
}
