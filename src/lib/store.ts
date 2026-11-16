"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_BRIEF, SAMPLE_ABSTRACT } from "./data";
import { generateSampleKit } from "./generator";
import type { Asset, Brief, GenerationSource, MlrState } from "./types";

/*
 * Client-side state for the prototype, kept in sessionStorage so a refresh in
 * the middle of a demo does not lose the campaign. In production this is the
 * database: campaigns, assets, review decisions and schedules are rows, and
 * these functions become API calls.
 */

export interface DemoState {
  brief: Brief;
  assets: Asset[];
  source: GenerationSource | null;
  note: string | null;
  mlr: MlrState;
  routedComments: string[];
}

const INITIAL: DemoState = {
  brief: DEFAULT_BRIEF,
  assets: [],
  source: null,
  note: null,
  mlr: "none",
  routedComments: [],
};

const KEY = "cadence-demo-v1";
let state: DemoState = INITIAL;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const saved = window.sessionStorage.getItem(KEY);
    if (saved) state = { ...INITIAL, ...(JSON.parse(saved) as Partial<DemoState>) };
  } catch {
    // Storage can be unavailable (private windows); the demo still works without it.
  }
}

function set(patch: Partial<DemoState>) {
  state = { ...state, ...patch };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // See above.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDemo(): DemoState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

export const setBrief = (patch: Partial<Brief>) => set({ brief: { ...state.brief, ...patch } });

export const setKit = (assets: Asset[], source: GenerationSource, note: string | null) =>
  set({ assets, source, note, mlr: "none" });

export function updateAsset(id: string, patch: Partial<Asset>) {
  set({ assets: state.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
}

/** Editing copy after approval sends the asset back to draft, as it would in a real review system. */
export function editBody(id: string, body: string) {
  const edited = state.assets.map((a) =>
    a.id === id ? { ...a, body, status: "draft" as const, scheduledAt: null } : a,
  );
  set({ assets: edited, mlr: state.mlr === "approved" ? "none" : state.mlr });
}

export const setMlr = (mlr: MlrState) => set({ mlr });

export function markAll(status: Asset["status"]) {
  set({ assets: state.assets.map((a) => ({ ...a, status })) });
}

export const routeComment = (id: string) =>
  set({ routedComments: [...new Set([...state.routedComments, id])] });

export const resetDemo = () => set({ ...INITIAL });

/** Lets a presenter open any screen directly without running the generator first. */
export function loadSampleKit() {
  const brief = { ...DEFAULT_BRIEF, source: SAMPLE_ABSTRACT };
  set({ brief, assets: generateSampleKit(brief), source: "sample", note: null, mlr: "none" });
}
