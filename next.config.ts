import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 옛 정적 HTML URL을 새 Next.js 라우트로 영구 리다이렉트.
      // /docs/setup-guide.html에 들어오면 layout.tsx의 nav를 못 받아서
      // 다른 페이지와 톤이 어긋났음 — /setup-guide로 보내 layout 안에서 렌더.
      {
        source: "/docs/setup-guide.html",
        destination: "/setup-guide",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
