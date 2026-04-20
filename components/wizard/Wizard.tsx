"use client";

import { WizardProvider, useWizard } from "./WizardContext";
import Step1Generate from "./Step1Generate";
import Step2Style from "./Step2Style";
import Step3Export from "./Step3Export";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "카피 생성" },
  { n: 2, label: "스타일 설정" },
  { n: 3, label: "PNG 내보내기" },
];

function StepIndicator() {
  const { step, setStep, copies, selectedCopy } = useWizard();

  // 각 스텝 이동 가능 여부
  const canGo = (target: number) => {
    if (target === 1) return true;
    if (target === 2) return copies.length > 0 && selectedCopy !== null;
    if (target === 3) return selectedCopy !== null;
    return false;
  };

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const clickable = canGo(s.n) && step !== s.n;
        return (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => clickable && setStep(s.n as 1 | 2 | 3)}
              disabled={!clickable}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                step === s.n
                  ? "bg-zinc-900 text-white"
                  : step > s.n
                  ? "text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                  : "text-zinc-300 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "size-4 rounded-full flex items-center justify-center text-[10px] font-black",
                step === s.n ? "bg-white text-zinc-900" : step > s.n ? "bg-zinc-300 text-white" : "bg-zinc-100 text-zinc-400"
              )}>{s.n}</span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-px mx-1", step > s.n ? "bg-zinc-400" : "bg-zinc-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WizardBody() {
  const { step } = useWizard();

  // Step2는 패딩 없이 full-height로 채움
  if (step === 2) {
    return (
      <div className="flex-1 flex overflow-hidden">
        <Step2Style />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-full py-12 px-6 flex items-start justify-center">
        {step === 1 && <Step1Generate />}
        {step === 3 && <Step3Export />}
      </div>
    </div>
  );
}

export default function Wizard() {
  return (
    <WizardProvider>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        {/* Navbar */}
        <nav className="border-b border-zinc-100 bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="size-9 flex items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="AD-Factory" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tighter text-zinc-900">AGZ-Studio</span>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">알감자 스튜디오</span>
            </div>
          </div>
          <StepIndicator />
          <div className="w-32" />
        </nav>

        <WizardBody />
      </div>
    </WizardProvider>
  );
}
