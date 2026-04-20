"use client";

import { Download, RotateCcw, CheckCircle } from "lucide-react";
import { useWizard } from "./WizardContext";

export default function Step3Export() {
  const { exportDataUrl, selectedCopy, setStep } = useWizard();

  const handleDownload = () => {
    if (!exportDataUrl) return;
    const link = document.createElement("a");
    link.download = `AD-Factory-${Date.now()}.png`;
    link.href = exportDataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          <CheckCircle className="size-3" /> Step 3 — 완료
        </div>
        <h2 className="text-2xl font-black text-zinc-900">이미지 다운로드</h2>
        <p className="text-sm text-zinc-500">생성된 광고 이미지를 PNG로 저장하세요.</p>
      </div>

      {/* Preview */}
      {exportDataUrl && (
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-100">
          <img src={exportDataUrl} alt="생성된 광고 이미지" className="w-full object-contain" />
        </div>
      )}

      {/* Copy info */}
      {selectedCopy && (
        <div className="w-full bg-zinc-50 rounded-2xl p-4 space-y-1 border border-zinc-100">
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">선택된 카피</div>
          <div className="font-bold text-zinc-900">{selectedCopy.mainHeadline}</div>
          <div className="text-sm text-zinc-500">{selectedCopy.subHeadline}</div>
          <div className="inline-block bg-zinc-900 text-white text-xs font-bold px-3 py-1 rounded-full mt-1">{selectedCopy.cta}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
        >
          <RotateCcw className="size-4" /> 처음부터
        </button>
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
        >
          스타일 수정
        </button>
        <button
          onClick={handleDownload}
          disabled={!exportDataUrl}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] shadow-lg"
        >
          <Download className="size-4" /> PNG 다운로드
        </button>
      </div>
    </div>
  );
}
