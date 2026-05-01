import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  text: string;
  voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer";
  model?: "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts";
  speed?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "nova", model = "gpt-4o-mini-tts", speed = 1.0 } =
      (await request.json()) as TTSRequest;

    if (!text?.trim()) {
      return NextResponse.json({ error: "text가 비어있습니다." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    // 키 없으면 클라이언트가 Web Speech 폴백을 쓰도록 503.
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS 미구성 — Web Speech 폴백" },
        { status: 503 },
      );
    }

    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        speed,
        response_format: "mp3",
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("OpenAI TTS error:", upstream.status, errText);
      return NextResponse.json(
        { error: `TTS 업스트림 오류 (${upstream.status})` },
        { status: 502 },
      );
    }

    const audio = await upstream.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("tts route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "서버 오류",
      },
      { status: 500 },
    );
  }
}
