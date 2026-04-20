import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// AI 공급자 전환 스위치
// 테스트: "gemini"  (Google AI Studio 무료)
// 오픈: "openai"   (OpenAI GPT-4o 유료)
// ─────────────────────────────────────────────
const AI_PROVIDER: "gemini" | "openai" = "gemini";

const SYSTEM_PROMPT = `당신은 네이버 GFA(성과형 디스플레이 광고) 전문 카피라이터입니다.
목표는 심사 반려 위험을 줄이면서 CTR이 높을 가능성이 큰 배너 카피 시안을 만드는 것입니다.
여기서 카피를 잘 만들지 못해 매출을 증가하지 못하면 일자리를 잃고 백수가 됩니다.
카피 작성 원칙은 **무조건** 지켜야합니다.

[카피 작성 원칙]
- 후킹은 강하게: 타겟이 실제로 겪는 불편함·찜찜함·아쉬움을 콕 집어서 말해야 함 (사실을 기반하여 강한 구매욕구 증진)
- 경쟁사 비교 금지
- 실제 제공된 정보만 사용
- 헤드라인 메인과 서브에서 동일 단어 중복 금지
- 핵심 1개만 강조 (기능 3~4개 나열 금지)
- 구조: 후킹 → 혜택 → 행동유도
- '어떤 불편함 → 이 제품 → 즉시 해결' 구조 활용
- 타겟별로 표현 톤을 다르게 (기능 직관형 / 설득 구조형 / 타겟형)
- CTR이 잘 나올 것 같은 순서로 정렬
- AI 티나는 단어 선택 금지 ("완벽한", "혁신적인", "탁월한", "특별한" 같은 형용사 쓰지 말 것)
- 후킹 문장은 짧고 구어체로, 실제 사람이 쓴 것처럼
- 너무 광고 냄새 나는 문어체·경어체 지양

[톤 레퍼런스 — 이 수준의 후킹·구어체·밀도로 작성할 것]
아래는 이상적인 후킹 멘트입니다. 문구를 그대로 쓰지 말고, 이 에너지·밀도·구조를 따라하세요. 
(소비자 불편함,찜찜함,아쉬움 해결 강조)

멘트1 : 눈뽕 컷! 0.1초 자동변색
멘트2 : 코 눌림 안녕! 29g 깃털핏
멘트3 : 여름 뙤약볕? UV400 철벽방어
멘트4 : 갓성비 미쳤다! 3만원대 풀세트
멘트5 : 평점 4.88! 형님들이 인정한
멘트6 : 1만5천원 패키지 공짜?
멘트7 : 러닝메이트랑 사면 만원 뚝 

핵심 패턴:
- 메인은 "문제 직격 + 해결" 또는 "숫자/사실 + 감탄" 구조
- 버튼은 반드시 "품절/완판 키워드 + 가격 + 혜택" 3요소 압축
- 구어체 감탄사·줄임말 적극 활용 (컷, 안녕, 뚝, 덤, 공짜, 미쳤다 등)
- 타겟의 페인포인트를 한 단어로 호명 (눈뽕, 코 눌림, 뙤약볕 등)

[배너 구성(layout) 규칙]
배너는 메인·서브·버튼 3가지 요소로 구성되며, 시안마다 아래 패턴 중 하나를 골라 layout 필드에 기입하세요.
가능한 패턴(이 중에서만 선택):
- 메인-버튼          : 서브 없이 메인+버튼만
- 메인-서브-버튼      : 가장 일반적인 구성
- 서브-메인-버튼      : 서브로 후킹, 메인으로 강조
10개 시안 전체가 동일한 구성이 되어서는 안 됩니다. 세 패턴을 골고루 섞어 사용하세요.
layout이 "메인-버튼"인 경우 subHeadline은 빈 문자열("")로 반환하세요.

[출력 형식 — 반드시 아래 JSON만 반환, 설명 없이]
{
  "results": [
    {
      "targetLabel": "타겟1",
      "layout": "서브-메인-버튼",
      "mainHeadline": "메인 카피 (15자 이내)",
      "subHeadline": "서브 카피 (25자 이내, layout이 메인-버튼이면 빈 문자열)",
      "cta": "버튼 문구 (가격·혜택·긴급감 포함, 20자 이내)"
    }
  ]
}`;

// ─────────────────────────────────────────────
// Gemini (Google AI Studio)
// 환경변수: GEMINI_API_KEY
// 발급: https://aistudio.google.com/apikey
// ─────────────────────────────────────────────
async function generateWithGemini(productInfo: string, targets: string, conditions: string): Promise<object> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const userMessage = buildUserMessage(productInfo, targets, conditions);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.85,
    },
  });

  const text = response.text ?? "";
  return JSON.parse(text);
}

// ─────────────────────────────────────────────
// OpenAI (GPT-4o)
// 환경변수: OPENAI_API_KEY
// 발급: https://platform.openai.com/api-keys
// ─────────────────────────────────────────────
async function generateWithOpenAI(productInfo: string, targets: string, conditions: string): Promise<object> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(productInfo, targets, conditions) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

function buildUserMessage(productInfo: string, targets: string, conditions: string): string {
  return `[제품 정보]\n${productInfo}\n\n[타겟]\n${targets}${conditions ? `\n\n[추가 조건]\n${conditions}` : ""}`;
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { productInfo, targets, conditions } = await req.json();

    if (!productInfo?.trim()) {
      return NextResponse.json({ error: "productInfo is required" }, { status: 400 });
    }

    const apiKey =
      AI_PROVIDER === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: `${AI_PROVIDER === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"} 환경변수가 설정되지 않았습니다.` },
        { status: 500 }
      );
    }

    const result =
      AI_PROVIDER === "gemini"
        ? await generateWithGemini(productInfo, targets ?? "", conditions ?? "")
        : await generateWithOpenAI(productInfo, targets ?? "", conditions ?? "");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "카피 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
