/// <reference lib="webworker" />
import { decide, type Difficulty } from './ai';
import type { GameState } from './engine';

export interface AIRequest {
  id: number;
  state: GameState;
  difficulty: Difficulty;
}

self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { id, state, difficulty } = e.data;
  self.postMessage({ id, decision: decide(state, difficulty, Math.random) });
};
