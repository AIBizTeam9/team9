"use client";

import type { WhyTree, WhyNode } from "@/lib/whytree/types";

type Props = {
  tree: WhyTree;
};

// 깊이 우선 트리 시각화. SEED는 잎(트리의 시작점)이지만 시각적으로는
// 위쪽이 목적(why), 아래로 내려갈수록 구체(seed/how)가 되도록
// rootIds(부모 없는 노드)부터 children을 따라 들여쓰기로 표시.
export default function WhyTreeView({ tree }: Props) {
  const isEmpty = Object.keys(tree.nodes).length === 0;

  if (isEmpty) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "var(--bg-2)",
          border: "1px dashed var(--line-2)",
          color: "var(--ink-3)",
        }}
      >
        <p className="font-serif text-[18px] mb-2" style={{ color: "var(--ink)" }}>
          {tree.name}
        </p>
        <p className="text-[13px]">
          대화를 시작하면 발견한 것들이 여기에 트리로 자라납니다.
        </p>
      </div>
    );
  }

  const visited = new Set<string>();

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="font-serif text-[18px]" style={{ color: "var(--ink)" }}>
          {tree.name}
        </p>
        <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
          {Object.keys(tree.nodes).length}개 노드 · {tree.seedIds.length}시드
        </p>
      </div>

      <div className="space-y-1">
        {tree.rootIds.map((rid) => (
          <NodeBranch
            key={rid}
            tree={tree}
            nodeId={rid}
            depth={0}
            visited={visited}
            isLastChild={true}
            ancestorPipes={[]}
          />
        ))}
      </div>

      {(tree.purpose || tree.lastExperimentId) && (
        <div
          className="mt-6 pt-5 space-y-3"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          {tree.purpose && (
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.08em] mb-1"
                style={{ color: "var(--ink-3)" }}
              >
                목적 진술
              </p>
              <p
                className="text-[14px] leading-relaxed font-serif"
                style={{ color: "var(--ink)" }}
              >
                {tree.purpose}
              </p>
            </div>
          )}
          {tree.lastExperimentId && tree.nodes[tree.lastExperimentId] && (
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.08em] mb-1"
                style={{ color: "var(--green)" }}
              >
                오늘의 실험
              </p>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                {tree.nodes[tree.lastExperimentId].label}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function nodeStyle(node: WhyNode): { color: string; bg: string; tag: string } {
  if (node.type === "seed") {
    return { color: "var(--warm)", bg: "var(--warm-soft)", tag: "시드" };
  }
  if (node.type === "why") {
    return { color: "var(--blue)", bg: "var(--blue-soft)", tag: "왜" };
  }
  return { color: "var(--green)", bg: "var(--green-soft)", tag: "어떻게" };
}

function NodeBranch({
  tree,
  nodeId,
  depth,
  visited,
  isLastChild,
  ancestorPipes,
}: {
  tree: WhyTree;
  nodeId: string;
  depth: number;
  visited: Set<string>;
  isLastChild: boolean;
  ancestorPipes: boolean[];
}) {
  const node = tree.nodes[nodeId];
  if (!node) return null;

  const seenBefore = visited.has(nodeId);
  if (!seenBefore) visited.add(nodeId);

  const { color, bg, tag } = nodeStyle(node);
  const isExperiment = tree.lastExperimentId === nodeId;
  const convergence = node.parentIds.length >= 2;

  return (
    <div>
      <div className="flex items-start gap-2 py-1.5">
        {/* 좌측 들여쓰기 가이드 */}
        <div className="flex-shrink-0 flex">
          {ancestorPipes.map((show, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                width: 14,
                color: show ? "var(--line-2)" : "transparent",
              }}
            >
              {show ? "│" : ""}
            </span>
          ))}
          {depth > 0 && (
            <span
              style={{ width: 14, color: "var(--line-2)" }}
            >
              {isLastChild ? "└" : "├"}
            </span>
          )}
        </div>

        {/* 노드 카드 */}
        <div
          className="flex-1 rounded-lg px-3 py-2 flex items-start gap-2"
          style={{
            background: isExperiment ? "var(--green-soft)" : bg,
            border: `1px solid ${isExperiment ? "var(--green)" : "transparent"}`,
          }}
        >
          <span
            className="flex-shrink-0 mt-0.5 text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.6)",
              color,
            }}
          >
            {tag}
          </span>
          <span
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--ink)" }}
          >
            {node.label}
            {seenBefore && (
              <span
                className="ml-2 text-[10px] opacity-60"
                style={{ color: "var(--ink-3)" }}
              >
                (위에서 본 노드)
              </span>
            )}
            {convergence && !seenBefore && (
              <span
                className="ml-2 text-[10px]"
                style={{ color: "var(--ink-3)" }}
              >
                ★수렴
              </span>
            )}
            {isExperiment && (
              <span
                className="ml-2 text-[10px] font-semibold"
                style={{ color: "var(--green)" }}
              >
                · 오늘의 실험
              </span>
            )}
          </span>
        </div>
      </div>

      {!seenBefore &&
        node.childIds.map((cid, i) => (
          <NodeBranch
            key={cid}
            tree={tree}
            nodeId={cid}
            depth={depth + 1}
            visited={visited}
            isLastChild={i === node.childIds.length - 1}
            ancestorPipes={[...ancestorPipes, !isLastChild]}
          />
        ))}
    </div>
  );
}
