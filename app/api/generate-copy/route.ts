import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, target, concept } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key not configured" },
        { status: 500 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 광고 카피라이터입니다. 제품 설명을 바탕으로 3가지 매력적인 광고 카피 세트를 생성하세요. 모든 텍스트는 한국어로 작성해야 합니다.
          
          각 세트의 구성:
          1. mainHeadline: 메인 카피 (최대 20자)
          2. subHeadline: 서브 카피 (최대 40자)
          3. cta: 행동 유도 문구 (최대 10자)
          
          응답은 반드시 { "results": [ { mainHeadline, subHeadline, cta }, ... ] } 형식인 JSON 객체여야 합니다.`
        },
        {
          role: "user",
          content: `Product: ${prompt}\nTarget: ${target}\nConcept: ${concept}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || "{}"));
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate copy" },
      { status: 500 }
    );
  }
}
