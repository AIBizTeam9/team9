export type NodeType = "seed" | "why" | "how";

export interface WhyNode {
  id: string;
  label: string;
  type: NodeType;
  parentIds: string[];
  childIds: string[];
  createdAt: string;
}

export interface WhyTree {
  schemaVersion: 1;
  name: string;
  nodes: Record<string, WhyNode>;
  rootIds: string[];
  seedIds: string[];
  currentNodeId: string | null;
  lastExperimentId: string | null;
  createdAt: string;
  updatedAt: string;
  purpose: string | null;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  ts: string;
}

// SSE event types streamed from /api/whytree
export type WTStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; op: string; input: Record<string, unknown>; result: Record<string, unknown> }
  | { type: "tree"; tree: WhyTree }
  | { type: "done" }
  | { type: "error"; message: string };
