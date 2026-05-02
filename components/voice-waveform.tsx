"use client";

import { useEffect, useRef } from "react";

type Props = {
  analyser: AnalyserNode | null;
  active: boolean;
  color: string;
  height?: number;
  bars?: number;
};

// AnalyserNode → Canvas 막대 그래프. analyser가 mic이면 사용자 음성, 출력 노드면 AI 음성.
export default function VoiceWaveform({
  analyser,
  active,
  color,
  height = 48,
  bars = 32,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const buffer = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      ctx2d.clearRect(0, 0, w, h);

      if (analyser && buffer) analyser.getByteFrequencyData(buffer);

      const barW = w / bars;
      const stride = buffer ? Math.floor(buffer.length / bars) : 0;

      ctx2d.fillStyle = color;
      for (let i = 0; i < bars; i++) {
        let v: number;
        if (active && analyser && buffer) {
          v = buffer[i * stride] / 255;
        } else {
          // 비활성 상태: 매우 작은 ambient 펄스
          v = 0.04 + 0.02 * Math.sin(Date.now() / 600 + i * 0.4);
        }
        const minH = 2 * dpr;
        const barH = Math.max(minH, v * h * 0.85);
        const x = i * barW + barW * 0.2;
        const y = (h - barH) / 2;
        ctx2d.fillRect(x, y, barW * 0.6, barH);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active, color, bars]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, width: "100%", display: "block" }}
    />
  );
}
