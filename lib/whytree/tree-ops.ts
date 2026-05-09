import type { WhyTree, WhyNode } from "./types";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const r = () => Math.random().toString(36).slice(2, 10);
  return `${r()}-${r()}-${r()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function newTree(name: string = "내 트리"): WhyTree {
  const t = nowIso();
  return {
    schemaVersion: 1,
    name,
    nodes: {},
    rootIds: [],
    seedIds: [],
    currentNodeId: null,
    lastExperimentId: null,
    createdAt: t,
    updatedAt: t,
    purpose: null,
  };
}

export function addSeed(
  tree: WhyTree,
  label: string,
): { tree: WhyTree; nodeId: string } {
  const id = uuid();
  const node: WhyNode = {
    id,
    label,
    type: "seed",
    parentIds: [],
    childIds: [],
    createdAt: nowIso(),
  };
  return {
    tree: {
      ...tree,
      nodes: { ...tree.nodes, [id]: node },
      rootIds: [...tree.rootIds, id],
      seedIds: [...tree.seedIds, id],
      updatedAt: nowIso(),
    },
    nodeId: id,
  };
}

// 자식 노드 위로 새 why 노드를 끼움. 같은 라벨의 why 노드가 있으면 수렴(연결).
export function whyUp(
  tree: WhyTree,
  childId: string,
  label: string,
): { tree: WhyTree; nodeId: string } {
  const child = tree.nodes[childId];
  if (!child) throw new Error(`whyUp: childId ${childId} 없음`);

  const existing = Object.values(tree.nodes).find(
    (n) =>
      n.type === "why" &&
      n.label.toLowerCase() === label.toLowerCase() &&
      n.id !== childId,
  );

  if (existing) {
    // 수렴
    if (child.parentIds.includes(existing.id)) {
      return { tree, nodeId: existing.id };
    }
    const newChild = {
      ...child,
      parentIds: [...child.parentIds, existing.id],
    };
    const newExisting = {
      ...existing,
      childIds: existing.childIds.includes(child.id)
        ? existing.childIds
        : [...existing.childIds, child.id],
    };
    let rootIds = tree.rootIds.filter((id) => id !== childId);
    if (
      !rootIds.includes(existing.id) &&
      newExisting.parentIds.length === 0
    ) {
      rootIds = [...rootIds, existing.id];
    }
    return {
      tree: {
        ...tree,
        nodes: {
          ...tree.nodes,
          [child.id]: newChild,
          [existing.id]: newExisting,
        },
        rootIds,
        updatedAt: nowIso(),
      },
      nodeId: existing.id,
    };
  }

  const id = uuid();
  const newNode: WhyNode = {
    id,
    label,
    type: "why",
    parentIds: [],
    childIds: [childId],
    createdAt: nowIso(),
  };
  const newChild = { ...child, parentIds: [...child.parentIds, id] };
  const rootIds = tree.rootIds.includes(childId)
    ? tree.rootIds.filter((rid) => rid !== childId).concat(id)
    : [...tree.rootIds, id];

  return {
    tree: {
      ...tree,
      nodes: { ...tree.nodes, [child.id]: newChild, [id]: newNode },
      rootIds,
      updatedAt: nowIso(),
    },
    nodeId: id,
  };
}

export function howDown(
  tree: WhyTree,
  parentId: string,
  label: string,
): { tree: WhyTree; nodeId: string } {
  const parent = tree.nodes[parentId];
  if (!parent) throw new Error(`howDown: parentId ${parentId} 없음`);

  const id = uuid();
  const newNode: WhyNode = {
    id,
    label,
    type: "how",
    parentIds: [parentId],
    childIds: [],
    createdAt: nowIso(),
  };
  const newParent = { ...parent, childIds: [...parent.childIds, id] };

  return {
    tree: {
      ...tree,
      nodes: { ...tree.nodes, [parent.id]: newParent, [id]: newNode },
      updatedAt: nowIso(),
    },
    nodeId: id,
  };
}

export function converge(
  tree: WhyTree,
  id1: string,
  id2: string,
  label: string,
): { tree: WhyTree; nodeId: string } {
  const n1 = tree.nodes[id1];
  const n2 = tree.nodes[id2];
  if (!n1 || !n2) throw new Error(`converge: 노드 없음`);

  const id = uuid();
  const newNode: WhyNode = {
    id,
    label,
    type: "why",
    parentIds: [],
    childIds: [id1, id2],
    createdAt: nowIso(),
  };
  const newN1 = { ...n1, parentIds: [...n1.parentIds, id] };
  const newN2 = { ...n2, parentIds: [...n2.parentIds, id] };

  const rootIds = tree.rootIds
    .filter((rid) => rid !== id1 && rid !== id2)
    .concat(id);

  return {
    tree: {
      ...tree,
      nodes: { ...tree.nodes, [id1]: newN1, [id2]: newN2, [id]: newNode },
      rootIds,
      updatedAt: nowIso(),
    },
    nodeId: id,
  };
}

export function setPurpose(tree: WhyTree, purpose: string): WhyTree {
  return { ...tree, purpose, updatedAt: nowIso() };
}

export function setExperiment(tree: WhyTree, nodeId: string): WhyTree {
  if (!tree.nodes[nodeId]) return tree;
  return { ...tree, lastExperimentId: nodeId, updatedAt: nowIso() };
}

// LLM이 부르는 도구의 디스패처. tree와 result를 둘 다 돌려준다.
export function applyTool(
  tree: WhyTree,
  name: string,
  input: Record<string, unknown>,
): { tree: WhyTree; result: Record<string, unknown> } {
  try {
    switch (name) {
      case "add_seed": {
        const { nodeId, tree: t } = addSeed(tree, String(input.label ?? ""));
        return { tree: t, result: { ok: true, node_id: nodeId } };
      }
      case "why_up": {
        const { nodeId, tree: t } = whyUp(
          tree,
          String(input.child_id ?? ""),
          String(input.label ?? ""),
        );
        return { tree: t, result: { ok: true, node_id: nodeId } };
      }
      case "how_down": {
        const { nodeId, tree: t } = howDown(
          tree,
          String(input.parent_id ?? ""),
          String(input.label ?? ""),
        );
        return { tree: t, result: { ok: true, node_id: nodeId } };
      }
      case "converge": {
        const { nodeId, tree: t } = converge(
          tree,
          String(input.id1 ?? ""),
          String(input.id2 ?? ""),
          String(input.label ?? ""),
        );
        return { tree: t, result: { ok: true, node_id: nodeId } };
      }
      case "set_purpose": {
        const t = setPurpose(tree, String(input.purpose ?? ""));
        return { tree: t, result: { ok: true } };
      }
      case "set_experiment": {
        const t = setExperiment(tree, String(input.node_id ?? ""));
        return { tree: t, result: { ok: true } };
      }
      default:
        return {
          tree,
          result: { ok: false, error: `unknown tool: ${name}` },
        };
    }
  } catch (err) {
    return {
      tree,
      result: { ok: false, error: err instanceof Error ? err.message : "tool error" },
    };
  }
}

// LLM에 보낼 트리의 요약 뷰. JSON 그대로보단 자연어 가까운 구조가 토큰 효율 좋음.
export function treeForLLM(tree: WhyTree): string {
  if (Object.keys(tree.nodes).length === 0) return "(트리는 아직 비어 있습니다)";

  const lines: string[] = [];
  const visited = new Set<string>();

  const traverse = (id: string, depth: number) => {
    const n = tree.nodes[id];
    if (!n) return;
    const indent = "  ".repeat(depth);
    if (visited.has(id)) {
      lines.push(`${indent}↳ ${n.label} (위에서 이미 등장)`);
      return;
    }
    visited.add(id);
    const tag = n.type === "seed" ? "[SEED]" : n.type === "why" ? "[WHY]" : "[HOW]";
    const conv = n.parentIds.length >= 2 ? " ★수렴" : "";
    lines.push(`${indent}${tag} id=${n.id} | "${n.label}"${conv}`);
    for (const cid of n.childIds) traverse(cid, depth + 1);
  };

  for (const rid of tree.rootIds) traverse(rid, 0);

  if (tree.purpose) lines.push(`\n[목적 진술] ${tree.purpose}`);
  if (tree.lastExperimentId) {
    const exp = tree.nodes[tree.lastExperimentId];
    if (exp) lines.push(`[현재 실험] ${exp.label}`);
  }

  return lines.join("\n");
}
