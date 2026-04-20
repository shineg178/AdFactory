"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronRight, RotateCcw } from "lucide-react";
import { useWizard, AdCopy } from "./WizardContext";
import { cn } from "@/lib/utils";

export default function Step1Generate() {
  const { setCopies, setSelectedCopy, setStep } = useWizard();

  const [productInfo, setProductInfo] = useState("");
  const [targets, setTargets] = useState("");
  const [conditions, setConditions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copies, setLocalCopies] = useState<AdCopy[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!productInfo.trim()) return;
    setIsGenerating(true);
    setError(null);
    setLocalCopies([]);
    setSelected(null);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productInfo, targets, conditions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const results: AdCopy[] = data.results || [];
      setLocalCopies(results);
      setCopies(results);
    } catch (e: any) {
      setError(e.message || "카피 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (selected === null) return;
    setSelectedCopy(copies[selected]);
    setStep(2);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="size-3" /> Step 1
        </div>
        <h2 className="text-2xl font-black text-zinc-900">네이버 GFA 배너 카피 생성</h2>
        <p className="text-sm text-zinc-500">제품 정보·타겟·조건을 입력하면 AI가 CTR 최적화 시안을 만들어드립니다.</p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* 제품 정보 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">
            제품 정보 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder={`제품명, 핵심 기능, 가격, 혜택, 이벤트 등을 자유롭게 입력하세요.\n예) HNF 러닝 선글라스 / 0.1초 자동 변색 렌즈 / 29g 초경량 / 38,900원 / 30% 페이백 / 사은품 4종 / 4차 전량 품절·5차 예약 중`}
            className="w-full h-36 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        {/* 타겟 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">타겟</label>
          <textarea
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            placeholder={`타겟 그룹을 번호로 나열하세요.\n예)\n1. 35~59세 남성 마라톤·조깅 러너\n2. 햇빛·눈부심을 싫어하는 실전형 남성 러너\n3. 자외선에 예민한 남성 러너`}
            className="w-full h-28 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        {/* 중요 조건 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-700 uppercase tracking-widest">중요 조건</label>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder={`강조할 소구점, 시즌 이슈, 금지 표현 등 추가 조건을 입력하세요.\n예) 곧 여름이라 자외선·변색 강조 / 4차 품절 긴급성 강조 / 버튼에 가격+혜택+긴급감 필수`}
            className="w-full h-24 bg-white border border-zinc-300 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        <button
          onClick={generate}
          disabled={isGenerating || !productInfo.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-3.5 text-sm font-black shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? "시안 생성 중..." : "AI 카피 시안 생성"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Results */}
      {copies.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            생성된 시안 {copies.length}개 — 하나를 선택하세요
          </p>
          {copies.map((copy, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "w-full text-left p-5 rounded-2xl border-2 transition-all",
                selected === i
                  ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10"
                  : "border-zinc-100 bg-white hover:border-indigo-300"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  {/* 타겟 + 구성 배지 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
                      {copy.targetLabel || `시안${i + 1}`}
                    </span>
                    {copy.layout && (
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                        {copy.layout}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-zinc-300 ml-auto">#{i + 1}</span>
                  </div>
                  {/* 카피 본문 — layout 순서에 따라 표시 */}
                  <CopyPreview copy={copy} />
                </div>
                <div className={cn(
                  "size-5 rounded-full border-2 shrink-0 mt-1 transition-all",
                  selected === i ? "border-indigo-500 bg-indigo-500" : "border-zinc-300"
                )} />
              </div>
            </button>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={generate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-all"
            >
              <RotateCcw className="size-3.5" /> 다시 생성
            </button>
            <button
              onClick={handleNext}
              disabled={selected === null}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.98]"
            >
              스타일 설정하기 <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 구성(layout) 순서에 따라 메인/서브/버튼 순서를 맞춰서 렌더
function CopyPreview({ copy }: { copy: AdCopy }) {
  const parts = (copy.layout || "메인-서브-버튼")
    .split("-")
    .map((p) => p.trim().toLowerCase());

  const elementMap: Record<string, React.ReactNode> = {
    "메인": (
      <div key="main" className="text-base font-black text-zinc-900 leading-snug">
        {copy.mainHeadline}
      </div>
    ),
    "서브": copy.subHeadline ? (
      <div key="sub" className="text-sm text-zinc-500 leading-snug">{copy.subHeadline}</div>
    ) : null,
    "버튼": copy.cta ? (
      <div key="cta" className="inline-flex mt-0.5">
        <span className="bg-zinc-900 text-white text-xs font-bold px-3 py-1 rounded-full leading-snug">{copy.cta}</span>
      </div>
    ) : null,
  };

  const ordered = parts
    .map((p) => {
      if (p.includes("메인")) return elementMap["메인"];
      if (p.includes("서브")) return elementMap["서브"];
      if (p.includes("버튼")) return elementMap["버튼"];
      return null;
    })
    .filter(Boolean);

  // fallback: layout이 이상하면 기본 순서
  if (ordered.length === 0) {
    return <div className="space-y-1">{elementMap["메인"]}{elementMap["서브"]}{elementMap["버튼"]}</div>;
  }

  return <div className="space-y-1">{ordered}</div>;
}
