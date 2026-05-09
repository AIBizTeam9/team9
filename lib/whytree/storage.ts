"use client";

import type { ChatMessage, WhyTree } from "./types";
import { newTree } from "./tree-ops";

const TREE_KEY = "whytree:tree";
const MESSAGES_KEY = "whytree:messages";

export function loadTree(): WhyTree {
  if (typeof window === "undefined") return newTree();
  try {
    const raw = localStorage.getItem(TREE_KEY);
    if (!raw) return newTree();
    const parsed = JSON.parse(raw) as WhyTree;
    if (parsed.schemaVersion !== 1) return newTree();
    return parsed;
  } catch {
    return newTree();
  }
}

export function saveTree(tree: WhyTree): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TREE_KEY, JSON.stringify(tree));
  } catch {
    // quota or serialization issues — silent
  }
}

export function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TREE_KEY);
  localStorage.removeItem(MESSAGES_KEY);
}
