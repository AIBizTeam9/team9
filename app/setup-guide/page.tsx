import { promises as fs } from "fs";
import path from "path";

// 빌드 시점 1회 렌더 — setup-guide.html은 정적 콘텐츠.
export const dynamic = "force-static";

export const metadata = {
  title: "개발가이드 - Next Step in Life",
};

/**
 * 개발가이드 페이지를 Next.js layout 안에서 렌더링.
 *
 * 기존 public/docs/setup-guide.html(정적 파일)이 자체 nav·body·style을 갖고 있어
 * 다른 페이지와 톤이 어긋났음(특히 AuthButton 동적 상태 부재). 이 라우트는
 * 정적 HTML의 <nav>·<body>·<head>는 버리고 본문 마크업과 페이지 전용 style만
 * 추출해 layout.tsx의 사이트 nav 안으로 넣는다.
 *
 * CSS scope: setup-guide.html의 글로벌 룰 중 layout과 충돌할 수 있는
 * (body, .site-nav 관련, * reset)은 제거하고, 본문 클래스(.hero, .card, .step-row …)
 * 는 .setup-guide-scope wrapper 하위로 가두는 prefix를 적용해서 다른 페이지로
 * 누수되지 않게 한다.
 */
export default async function SetupGuidePage() {
  // source: docs/setup-guide.html (project root, not public/).
  // public/docs/setup-guide.html은 redirect 적용을 위해 삭제됨.
  const filePath = path.join(process.cwd(), "docs", "setup-guide.html");
  const raw = await fs.readFile(filePath, "utf8");

  const { body, css } = extractGuide(raw);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="setup-guide-scope"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </>
  );
}

function extractGuide(html: string): { body: string; css: string } {
  // 1. <body>...</body> 추출
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // 2. <nav class="site-nav">...</nav> 제거 (layout.tsx의 nav가 대체)
  bodyHtml = bodyHtml.replace(
    /<nav\s+class="site-nav"[\s\S]*?<\/nav>/i,
    "",
  );

  // 3. <head> 안 첫 <style> 추출 (페이지 전용 styling)
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let css = styleMatch ? styleMatch[1] : "";

  // 4. 글로벌 누수 위험 룰 제거
  //    - body { ... }: 사이트 전체 폰트 덮어쓰기 위험
  //    - * { margin/padding/box-sizing reset }: 다른 페이지에 영향
  //    - .site-nav 계열: 이제 layout이 nav 담당
  css = stripGlobalRule(css, "body");
  css = stripGlobalRule(css, "\\*");
  css = css.replace(/(^|\})\s*\.site-nav[^{]*\{[^}]*\}/g, "$1");

  // 5. 남은 모든 selector를 .setup-guide-scope 하위로 한정.
  //    @media·@keyframes·@font-face 등은 건드리지 않는다.
  css = scopeSelectors(css, ".setup-guide-scope");

  return { body: bodyHtml, css };
}

function stripGlobalRule(css: string, selector: string): string {
  // selector { ... } 한 블록 제거 (최상위만, 중첩 X)
  const re = new RegExp(
    `(^|\\})\\s*${selector}\\s*\\{[^}]*\\}`,
    "g",
  );
  return css.replace(re, "$1");
}

/**
 * CSS 블록의 selector를 모두 wrapper 하위로 prefix.
 * - "@" 시작 룰(at-rule)은 그 안의 nested 룰만 처리 (단순화: @media만)
 * - 단순한 정규식 처리 — setup-guide.html은 우리가 통제하는 파일이라 충분
 */
function scopeSelectors(css: string, scope: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < css.length) {
    // 공백 skip
    while (i < css.length && /\s/.test(css[i])) {
      out.push(css[i]);
      i++;
    }
    if (i >= css.length) break;

    // at-rule: @media, @keyframes 등
    if (css[i] === "@") {
      const blockStart = css.indexOf("{", i);
      if (blockStart < 0) {
        out.push(css.slice(i));
        break;
      }
      const head = css.slice(i, blockStart + 1);
      out.push(head);
      // 중첩 블록 추출
      let depth = 1;
      let j = blockStart + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }
      const inner = css.slice(blockStart + 1, j - 1);
      // @keyframes 안의 0%/100% 같은 selector는 prefix하지 않음
      if (head.startsWith("@keyframes") || head.startsWith("@-webkit-keyframes") || head.startsWith("@font-face")) {
        out.push(inner);
      } else {
        out.push(scopeSelectors(inner, scope));
      }
      out.push("}");
      i = j;
      continue;
    }

    // 일반 룰: selector-list { ... }
    const blockStart = css.indexOf("{", i);
    if (blockStart < 0) {
      out.push(css.slice(i));
      break;
    }
    const selectorList = css.slice(i, blockStart);
    const blockEnd = css.indexOf("}", blockStart);
    if (blockEnd < 0) {
      out.push(css.slice(i));
      break;
    }
    const block = css.slice(blockStart, blockEnd + 1);

    const scopedSelectors = selectorList
      .split(",")
      .map((s) => {
        const trimmed = s.trim();
        if (!trimmed) return "";
        // html, body 같은 글로벌 selector는 wrapper 자체로 매핑
        if (trimmed === "html" || trimmed === "body") return scope;
        return `${scope} ${trimmed}`;
      })
      .filter(Boolean)
      .join(", ");

    out.push(scopedSelectors + block);
    i = blockEnd + 1;
  }
  return out.join("");
}
