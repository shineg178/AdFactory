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
  const { step } = useWizard();
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            step === s.n ? "bg-zinc-900 text-white" : step > s.n ? "text-zinc-400" : "text-zinc-300"
          )}>
            <span className={cn(
              "size-4 rounded-full flex items-center justify-center text-[10px] font-black",
              step === s.n ? "bg-white text-zinc-900" : step > s.n ? "bg-zinc-300 text-white" : "bg-zinc-100 text-zinc-400"
            )}>{s.n}</span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("w-8 h-px mx-1", step > s.n ? "bg-zinc-400" : "bg-zinc-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

function WizardBody() {
  const { step } = useWizard();
  return (
    <div className="flex-1 overflow-auto">
      <div className={cn(
        "min-h-full py-12 px-6",
        step === 2 ? "flex items-start justify-center" : "flex items-start justify-center"
      )}>
        {step === 1 && <Step1Generate />}
        {step === 2 && <Step2Style />}
        {step === 3 && <Step3Export />}
      </div>
    </div>
  );
}

export default function Wizard() {
  return (
    <WizardProvider>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Navbar */}
        <nav className="border-b border-zinc-100 bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="size-9 flex items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="AD-Factory" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tighter text-zinc-900">AD-Factory</span>
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
