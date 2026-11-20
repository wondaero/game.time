import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HAND_SIZE, TILE_COUNT, TURN_MS,
  applyMove, createGame, randInt,
  type GameState, type Move, type PlayerId,
} from '../game/engine';
import { decide, difficultyLabel, thinkTime, type Decision, type Difficulty } from '../game/ai';

export type GameMode =
  | { kind: 'practice'; difficulty: Difficulty }
  | { kind: 'local' };

export interface AIView {
  phase: 'idle' | 'thinking' | 'aiming';
  /** 지금 AI 가 보고 있는 칸 */
  glance: number | null;
  /** AI 가 집어든 카드 */
  card: number | null;
}
const IDLE_AI: AIView = { phase: 'idle', glance: null, card: null };

function glanceTile(board: GameState['board']): number {
  const filled = board.flatMap((v, i) => (v === null ? [] : [i]));
  if (!filled.length || rng() < 0.25) return randInt(rng, 0, TILE_COUNT - 1);
  const base = filled[randInt(rng, 0, filled.length - 1)];
  const r = Math.floor(base / 5) + randInt(rng, -1, 1);
  const c = (base % 5) + randInt(rng, -1, 1);
  return r >= 0 && r < 5 && c >= 0 && c < 5 ? r * 5 + c : base;
}

const rng = Math.random;
const AFTER_MOVE_MS = 550;
const AFTER_FORCED_MS = 1500;

const namesFor = (mode: GameMode): [string, string] =>
  mode.kind === 'practice' ? ['나', `AI · ${difficultyLabel(mode.difficulty)}`] : ['플레이어 1', '플레이어 2'];

/** 플레이어 0 = 아래(사람), 플레이어 1 = 위(AI 또는 맞은편 사람) */
export function useGame(mode: GameMode) {
  const [state, setState] = useState<GameState>(() => createGame(namesFor(mode), rng));
  const stateRef = useRef(state);
  const [busy, setBusy] = useState(false);
  const [turnStartedAt, setTurnStartedAt] = useState(() => performance.now());
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const isAI = useCallback((p: PlayerId) => mode.kind === 'practice' && p === 1, [mode.kind]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = useCallback((move: Move) => {
    const cur = stateRef.current;
    if (cur.winner !== null) return;
    const next = applyMove(cur, move, rng);
    stateRef.current = next;
    setState(next);
    setSelected(null);
    setBusy(true);

    const forced = next.placements.some((p) => p.by === 'system');
    if (forced) {
      setToast('시간이 뒤틀립니다!');
      later(() => setToast(null), AFTER_FORCED_MS);
    }
    later(() => {
      setBusy(false);
      setTurnStartedAt(performance.now());
    }, forced ? AFTER_FORCED_MS : AFTER_MOVE_MS);
  }, []);

  const canAct = !busy && state.winner === null && !isAI(state.turn);

  const selectCard = (idx: number) => {
    if (!canAct) return;
    setSelected((s) => (s === idx ? null : idx));
  };

  const placeAt = (tileIdx: number) => {
    if (!canAct || selected === null) return;
    play({ cardIdx: selected, tileIdx });
  };

  // AI 차례 — 계산은 Web Worker 에서 (초고수 계산 중에도 화면이 멈추지 않도록)
  const worker = useRef<Worker | null>(null);
  useEffect(() => {
    if (mode.kind !== 'practice') return;
    const w = new Worker(new URL('../game/ai.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, [mode.kind]);

  /**
   * AI 연출: 판을 훑어봄(glance) → 카드를 집음 → 칸을 조준 → 놓음.
   * 생각 시간은 수의 성격(승리/방어/계산…)에 따라 0.7~3초.
   */
  const [ai, setAi] = useState<AIView>(IDLE_AI);

  useEffect(() => {
    if (busy || state.winner !== null || mode.kind !== 'practice' || state.turn !== 1) return;
    const w = worker.current;
    const requested = stateRef.current;
    const startedAt = performance.now();
    const ids: number[] = [];
    let cancelled = false;
    const at = (ms: number, fn: () => void) => ids.push(window.setTimeout(() => !cancelled && fn(), Math.max(0, ms)));

    // 훑어보기: 숫자가 있는 칸과 그 주변을 주로 본다
    const glance = () => {
      if (cancelled) return;
      setAi((a) => (a.card !== null ? a : { ...a, phase: 'thinking', glance: glanceTile(requested.board) }));
      at(350 + rng() * 350, glance);
    };
    setAi({ ...IDLE_AI, phase: 'thinking' });
    at(250, glance);

    const perform = ({ move, reason }: Decision) => {
      if (cancelled || stateRef.current !== requested) return;
      const left = thinkTime(reason, rng) - (performance.now() - startedAt);
      at(left - 900, () => setAi((a) => ({ ...a, card: move.cardIdx })));
      at(left - 450, () => setAi((a) => ({ ...a, phase: 'aiming', glance: move.tileIdx })));
      at(left, () => {
        setAi(IDLE_AI);
        play(move);
      });
    };

    let detach = () => {};
    if (w) {
      const reqId = requested.seq;
      const onMsg = (e: MessageEvent<{ id: number; decision: Decision }>) => e.data.id === reqId && perform(e.data.decision);
      w.addEventListener('message', onMsg);
      w.postMessage({ id: reqId, state: requested, difficulty: mode.difficulty });
      detach = () => w.removeEventListener('message', onMsg);
    } else {
      perform(decide(requested, mode.difficulty, rng)); // Worker 미지원 fallback
    }

    return () => {
      cancelled = true;
      ids.forEach(clearTimeout);
      detach();
      setAi(IDLE_AI);
    };
  }, [state, busy, mode, play]);

  // 시간 초과 → 고른 카드(없으면 랜덤)를 랜덤 칸에 자동 배치
  useEffect(() => {
    if (busy || state.winner !== null || isAI(state.turn)) return;
    const remaining = TURN_MS - (performance.now() - turnStartedAt);
    const id = window.setTimeout(() => {
      play({
        cardIdx: selectedRef.current ?? randInt(rng, 0, HAND_SIZE - 1),
        tileIdx: randInt(rng, 0, TILE_COUNT - 1),
      });
    }, Math.max(0, remaining));
    return () => clearTimeout(id);
  }, [state, busy, turnStartedAt, isAI, play]);

  const restart = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const g = createGame(namesFor(mode), rng);
    stateRef.current = g;
    setState(g);
    setBusy(false);
    setSelected(null);
    setToast(null);
    setTurnStartedAt(performance.now());
  }, [mode]);

  return {
    state,
    busy,
    selected,
    toast,
    turnStartedAt,
    canAct,
    isAI,
    ai,
    selectCard,
    placeAt,
    restart,
  };
}
