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
  // 메인 카피
  mainFontFamily: string;
  mainFontSize: number;
  mainColor: string;
  mainFontWeight: "normal" | "bold";
  mainStrokeColor: string;
  mainStrokeWidth: number;
  mainOffsetY: number;   // % of canvas height, -50 ~ +50
  // 서브 카피
  subFontFamily: string;
  subFontSize: number;
  subColor: string;
  subStrokeColor: string;
  subStrokeWidth: number;
  subOffsetY: number;
  // CTA
  ctaFontFamily: string;
  ctaFontSize: number;
  ctaColor: string;
  ctaTextStrokeColor: string;
  ctaTextStrokeWidth: number;
  ctaBgColor: string;
  ctaShape: "pill" | "rect" | "none";
  ctaCornerRadius: number;
  ctaBorderColor: string;
  ctaBorderWidth: number;
  ctaOffsetY: number;
  showCta: boolean;
}

interface WizardContextType {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
  copies: AdCopy[];
  setCopies: (c: AdCopy[]) => void;
  selectedCopy: AdCopy | null;
  setSelectedCopy: (c: AdCopy | null) => void;
  updateSelectedCopy: (patch: Partial<AdCopy>) => void;
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  // Step1 입력값 보존
  productInfo: string;
  setProductInfo: (v: string) => void;
  targets: string;
  setTargets: (v: string) => void;
  conditions: string;
  setConditions: (v: string) => void;
  style: StyleSettings;
  setStyle: (s: StyleSettings | ((prev: StyleSettings) => StyleSettings)) => void;
  canvasW: number;
  setCanvasW: (v: number) => void;
  canvasH: number;
  setCanvasH: (v: number) => void;
  exportDataUrl: string | null;
  setExportDataUrl: (url: string | null) => void;
}

const DEFAULT_STYLE: StyleSettings = {
  aspectRatio: "1:1",
  bgColor: "#ffffff",
  mainFontFamily: "Pretendard Variable",
  mainFontSize: 72,
  mainColor: "#111111",
  mainFontWeight: "bold",
  mainStrokeColor: "#000000",
  mainStrokeWidth: 0,
  mainOffsetY: 0,
  subFontFamily: "Pretendard Variable",
  subFontSize: 32,
  subColor: "#555555",
  subStrokeColor: "#000000",
  subStrokeWidth: 0,
  subOffsetY: 0,
  ctaFontFamily: "Pretendard Variable",
  ctaFontSize: 24,
  ctaColor: "#ffffff",
  ctaTextStrokeColor: "#000000",
  ctaTextStrokeWidth: 0,
  ctaBgColor: "#111111",
  ctaShape: "pill",
  ctaCornerRadius: 8,
  ctaBorderColor: "#000000",
  ctaBorderWidth: 0,
  ctaOffsetY: 0,
  showCta: true,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copies, setCopies] = useState<AdCopy[]>([]);
  const [selectedCopy, setSelectedCopy] = useState<AdCopy | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [productInfo, setProductInfo] = useState("");
  const [targets, setTargets] = useState("");
  const [conditions, setConditions] = useState("");
  const [style, setStyle] = useState<StyleSettings>(DEFAULT_STYLE);
  const [canvasW, setCanvasW] = useState(1080);
  const [canvasH, setCanvasH] = useState(1080);
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);

  const updateSelectedCopy = (patch: Partial<AdCopy>) => {
    setSelectedCopy((prev) => prev ? { ...prev, ...patch } : prev);
  };

  return (
    <WizardContext.Provider value={{
      step, setStep,
      copies, setCopies,
      selectedCopy, setSelectedCopy,
      updateSelectedCopy,
      selectedIndex, setSelectedIndex,
      productInfo, setProductInfo,
      targets, setTargets,
      conditions, setConditions,
      style, setStyle,
      canvasW, setCanvasW,
      canvasH, setCanvasH,
      exportDataUrl, setExportDataUrl,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
