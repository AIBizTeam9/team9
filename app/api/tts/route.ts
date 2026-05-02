import { NextRequest, NextResponse } from "next/server";

type Voice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";
type Model = "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts";

interface TTSRequest {
  text: string;
  voice?: Voice;
  model?: Model;
  speed?: number;
}

// Edge runtime: cold start이 짧고 Web Streams를 그대로 흘려보낼 수 있어 first-byte 지연이 더 작음.
export const runtime = "edge";

async function streamTTS({
  text,
  voice = "nova",
  model = "gpt-4o-mini-tts",
  speed = 1.0,
}: TTSRequest): Promise<Response> {
  if (!text?.trim()) {
    return NextResponse.json({ error: "text가 비어있습니다." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
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

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error("OpenAI TTS error:", upstream.status, errText);
    return NextResponse.json(
      { error: `TTS 업스트림 오류 (${upstream.status})` },
      { status: 502 },
    );
  }

  // 핵심: arrayBuffer()로 버퍼링하지 않고 upstream body를 그대로 흘려보냄.
  // 클라이언트는 첫 청크 도착 즉시 재생을 시작할 수 있음.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "Transfer-Encoding": "chunked",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TTSRequest;
    return await streamTTS(body);
  } catch (error) {
    console.error("tts POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") ?? "";
    const voice = (searchParams.get("voice") ?? "nova") as Voice;
    const speedStr = searchParams.get("speed");
    const speed = speedStr ? parseFloat(speedStr) : 1.0;
    return await streamTTS({ text, voice, speed });
  } catch (error) {
    console.error("tts GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
