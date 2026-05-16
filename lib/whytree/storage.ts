"use client";

import type { ChatMessage, WhyTree } from "./types";
import { newTree } from "./tree-ops";

const TREE_KEY = (date: string) => `whytree:tree:${date}`;
const MESSAGES_KEY = (date: string) => `whytree:messages:${date}`;
const KNOWN_DATES_KEY = "whytree:dates";

function rememberDate(date: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KNOWN_DATES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(date)) {
      list.push(date);
      localStorage.setItem(KNOWN_DATES_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

export function loadLocalTree(date: string): WhyTree {
  if (typeof window === "undefined") return newTree(`${date} 트리`);
  try {
    const raw = localStorage.getItem(TREE_KEY(date));
    if (!raw) return newTree(`${date} 트리`);
    const parsed = JSON.parse(raw) as WhyTree;
    if (parsed.schemaVersion !== 1) return newTree(`${date} 트리`);
    return parsed;
  } catch {
    return newTree(`${date} 트리`);
  }
}

export function saveLocalTree(date: string, tree: WhyTree): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TREE_KEY(date), JSON.stringify(tree));
    rememberDate(date);
  } catch {
    // ignore
  }
}

export function loadLocalMessages(date: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY(date));
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveLocalMessages(date: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MESSAGES_KEY(date), JSON.stringify(messages));
    rememberDate(date);
  } catch {
    // ignore
  }
}

export function clearLocal(date: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TREE_KEY(date));
  localStorage.removeItem(MESSAGES_KEY(date));
}

export function listLocalDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KNOWN_DATES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as string[]).sort().reverse();
  } catch {
    return [];
  }
}
