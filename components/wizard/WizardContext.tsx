"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface AdCopy {
  targetLabel: string;  // 예: "타겟3"
  layout: string;       // 예: "서브-메인-버튼"
  mainHeadline: string;
  subHeadline: string;
  cta: string;
}

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export interface StyleSettings {
  aspectRatio: AspectRatio;
  bgColor: string;
  mainFontFamily: string;
  mainFontSize: number;
  mainColor: string;
  mainFontWeight: "normal" | "bold";
  subFontFamily: string;
  subFontSize: number;
  subColor: string;
  ctaFontFamily: string;
  ctaFontSize: number;
  ctaColor: string;
  ctaBgColor: string;
  showCta: boolean;
}

interface WizardContextType {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
  copies: AdCopy[];
  setCopies: (c: AdCopy[]) => void;
  selectedCopy: AdCopy | null;
  setSelectedCopy: (c: AdCopy | null) => void;
  style: StyleSettings;
  setStyle: (s: StyleSettings | ((prev: StyleSettings) => StyleSettings)) => void;
  exportDataUrl: string | null;
  setExportDataUrl: (url: string | null) => void;
}

const DEFAULT_STYLE: StyleSettings = {
  aspectRatio: "1:1",
  bgColor: "#ffffff",
  mainFontFamily: "Pretendard",
  mainFontSize: 72,
  mainColor: "#111111",
  mainFontWeight: "bold",
  subFontFamily: "Pretendard",
  subFontSize: 32,
  subColor: "#555555",
  ctaFontFamily: "Pretendard",
  ctaFontSize: 24,
  ctaColor: "#ffffff",
  ctaBgColor: "#111111",
  showCta: true,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copies, setCopies] = useState<AdCopy[]>([]);
  const [selectedCopy, setSelectedCopy] = useState<AdCopy | null>(null);
  const [style, setStyle] = useState<StyleSettings>(DEFAULT_STYLE);
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);

  return (
    <WizardContext.Provider value={{ step, setStep, copies, setCopies, selectedCopy, setSelectedCopy, style, setStyle, exportDataUrl, setExportDataUrl }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
