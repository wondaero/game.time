/**
 * 연습모드 AI — 학습 없이 가능한 모든 수(최대 3카드 × 25칸)를 for 문으로 탐색.
 *
 * 난이도는 "시야(어떤 패턴을 보는가)" + "계산(얼마나 앞을 보는가)" 확률로 정의한다.
 * 확률은 수를 놓을 때마다 새로 굴리며, 한 번 굴린 시야는 그 수의 공격·방어에 똑같이 적용된다.
 * (안 보이는 패턴은 이길 기회로도, 막아야 할 위협으로도 인식하지 못함)
 *
 *            같은숫자 정방향 역방향 대각선 다음턴계산 외통수
 *  초보         90%    90%   40%    40%     20%      -
 *  중급         90%    90%   90%    60%     40%      -
 *  고수         90%    90%   90%    90%     70%      -
 *  초고수      100%   100%  100%   100%    100%   공격+방어
 *
 *  정방향 = 왼→오, 위→아래로 읽을 때 1씩 커짐 (123). 역방향 = 작아짐 (321).
 */
import {
  HAND_SIZE, LINES_BY_TILE, MAX_NUM, SIZE, TILE_COUNT,
  addClock, other, pick,
  type Cell, type GameState, type Move, type Rng,
} from './engine';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface Profile {
  /** 같은 숫자(333)를 볼 확률 */
  same: number;
  /** 정방향(123)을 볼 확률 */
  asc: number;
  /** 역방향(321)을 볼 확률 */
  desc: number;
  /** 대각선을 볼 확률 */
  diag: number;
  /** 다음 턴 승리각을 계산할 확률 */
  plan: number;
  /** 상대 응수 + 외통수(공격/방어)까지 계산 */
  deep: boolean;
}

export const PROFILES: Record<Difficulty, Profile> = {
  beginner: { same: 0.9, asc: 0.9, desc: 0.4, diag: 0.4, plan: 0.2, deep: false },
  intermediate: { same: 0.9, asc: 0.9, desc: 0.9, diag: 0.6, plan: 0.4, deep: false },
  advanced: { same: 0.9, asc: 0.9, desc: 0.9, diag: 0.9, plan: 0.7, deep: false },
  master: { same: 1, asc: 1, desc: 1, diag: 1, plan: 1, deep: true },
};

export const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  // 약점은 공략법이 되므로 노출하지 않는다 — 강함의 정도만 전달
  { id: 'beginner', label: '초보', desc: '이제 막 시계 보는 법을 배웠어요.' },
  { id: 'intermediate', label: '중급', desc: '제법 시간을 읽을 줄 알아요.' },
  { id: 'advanced', label: '고수', desc: '쉽게 틈을 보이지 않아요.' },
  { id: 'master', label: '초고수', desc: '시간의 주인. 이길 수 있을까요?' },
];

export const difficultyLabel = (d: Difficulty) => DIFFICULTIES.find((x) => x.id === d)!.label;

/* ---------- 시야 ---------- */

export interface Vision {
  same: boolean;
  asc: boolean;
  desc: boolean;
  diag: boolean;
}
export const FULL_VISION: Vision = { same: true, asc: true, desc: true, diag: true };

export const rollVision = (p: Profile, rng: Rng): Vision => ({
  same: rng() < p.same,
  asc: rng() < p.asc,
  desc: rng() < p.desc,
  diag: rng() < p.diag,
});

interface VLine {
  a: number;
  b: number;
  c: number;
  diag: boolean;
}
const VLINES_BY_TILE: VLine[][] = LINES_BY_TILE.map((lines) =>
  lines.map(([a, b, c]) => ({
    a, b, c,
    diag: Math.floor(a / SIZE) !== Math.floor(b / SIZE) && a % SIZE !== b % SIZE,
  })),
);

function sees(v: Vision, a: Cell, b: Cell, c: Cell): boolean {
  if (a === null || b === null || c === null) return false;
  const d = b - a;
  if (c - b !== d) return false;
  return (d === 0 && v.same) || (d === 1 && v.asc) || (d === -1 && v.desc);
}

/** 시야 v 로 봤을 때, tile 에 value 를 놓으면 이긴다고 인식하는지 (board 는 잠깐 변경 후 원복) */
export function seesWin(v: Vision, board: Cell[], tile: number, value: number): boolean {
  const prev = board[tile];
  board[tile] = value;
  let win = false;
  for (const l of VLINES_BY_TILE[tile]) {
    if (l.diag && !v.diag) continue;
    if (sees(v, board[l.a], board[l.b], board[l.c])) {
      win = true;
      break;
    }
  }
  board[tile] = prev;
  return win;
}

/* ---------- helpers ---------- */

const ALL_VALUES = ((1 << (MAX_NUM + 1)) - 1) & ~1;
const handMask = (cards: readonly number[]) => cards.reduce((m, v) => m | (1 << v), 0);
const popcount = (m: number) => {
  let n = 0;
  for (; m; m &= m - 1) n++;
  return n;
};

/** 이 보드에서 놓기만 하면 이기는 카드 값들의 비트마스크. values 로 검사 대상 제한 가능 */
function winMask(board: Cell[], v: Vision, values = ALL_VALUES): number {
  let mask = 0;
  for (let t = 0; t < TILE_COUNT && mask !== values; t++)
    for (let n = 1; n <= MAX_NUM; n++) {
      const bit = 1 << n;
      if (!(values & bit) || mask & bit) continue;
      if (seesWin(v, board, t, addClock(board[t], n))) mask |= bit;
    }
  return mask;
}

const canWinWith = (board: Cell[], cards: readonly number[], v: Vision) => {
  const m = handMask(cards);
  return m !== 0 && winMask(board, v, m) !== 0;
};

/** 다음 내 턴에 이길 확률: 남은 카드로 이길 수 있으면 1, 아니면 새 카드(1~12)가 승리값일 확률 */
function nextWinChance(board: Cell[], kept: readonly number[], v: Vision): number {
  const mask = winMask(board, v);
  if (mask & handMask(kept)) return 1;
  return popcount(mask) / MAX_NUM;
}

interface Candidate {
  move: Move;
  board: Cell[];
  win: boolean;
  kept: number[];
}

/** 같은 숫자 카드는 결과가 같으므로 한 번만 탐색 */
function enumerate(board: readonly Cell[], hand: readonly number[], v: Vision): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<number>();
  for (let cardIdx = 0; cardIdx < HAND_SIZE; cardIdx++) {
    const card = hand[cardIdx];
    if (seen.has(card)) continue;
    seen.add(card);
    const kept = hand.filter((_, i) => i !== cardIdx);
    for (let tileIdx = 0; tileIdx < TILE_COUNT; tileIdx++) {
      const next = board.slice();
      const value = addClock(next[tileIdx], card);
      const win = seesWin(v, next, tileIdx, value);
      next[tileIdx] = value;
      out.push({ move: { cardIdx, tileIdx }, board: next, win, kept });
    }
  }
  return out;
}

function best<T>(items: T[], score: (x: T) => number, rng: Rng): T {
  let top = -Infinity;
  let pool: T[] = [];
  for (const x of items) {
    const s = score(x);
    if (s > top + 1e-9) {
      top = s;
      pool = [x];
    } else if (Math.abs(s - top) <= 1e-9) pool.push(x);
  }
  return pick(pool, rng);
}

/**
 * 상대가 reply 를 둔 뒤, 상대의 남은 카드로 확정 승리가 가능한데
 * 내 남은 카드(myKept)로는 이기지도 막지도 못하면 → 상대의 외통수.
 */
function isOpponentForced(reply: Candidate, myKept: readonly number[]): boolean {
  const v = FULL_VISION;
  if (!canWinWith(reply.board, reply.kept, v)) return false;
  if (canWinWith(reply.board, myKept, v)) return false;
  for (const block of enumerate(reply.board, myKept, v)) {
    if (!canWinWith(block.board, reply.kept, v)) return false;
  }
  return true;
}


/** AI 가 이 수를 둔 이유 (생각 시간·연출에 사용) */
export type Reason = 'win' | 'block' | 'desperate' | 'deep' | 'plan' | 'casual';

export interface Decision {
  move: Move;
  reason: Reason;
}

export function chooseMove(state: GameState, difficulty: Difficulty, rng: Rng): Move {
  return decide(state, difficulty, rng).move;
}

export function decide(state: GameState, difficulty: Difficulty, rng: Rng): Decision {
  const profile = PROFILES[difficulty];
  const vision = rollVision(profile, rng);

  const me = state.turn;
  const hand = state.players[me].hand;
  const oppHand = state.players[other(me)].hand;
  const oppMask = handMask(oppHand);

  const cands = enumerate(state.board, hand, vision);

  // 1. 보이는 승리수가 있으면 둔다
  const wins = cands.filter((c) => c.win);
  if (wins.length) return { move: pick(wins, rng).move, reason: 'win' };

  // 2. 보이는 위협은 막는다 (상대 손패로 즉시 이길 수 없는 수만 남김)
  const danger = new Map<Candidate, number>();
  for (const c of cands) danger.set(c, popcount(winMask(c.board, vision, oppMask)));
  const safe = cands.filter((c) => danger.get(c) === 0);
  if (!safe.length) return { move: best(cands, (c) => -danger.get(c)!, rng).move, reason: 'desperate' };
  const threatened = winMask(state.board.slice(), vision, oppMask) !== 0;

  // 3-a. 초고수: 상대의 모든 응수를 보고 (외통수 공격 / 상대 외통수 방어 / 최악의 경우 승률)
  if (profile.deep) {
    const move = best(
      safe,
      (c) => {
        let worstChance = Infinity;
        let allowsForced = false;
        for (const reply of enumerate(c.board, oppHand, vision)) {
          const p = nextWinChance(reply.board, c.kept, vision);
          if (p < worstChance) worstChance = p;
          if (!allowsForced && isOpponentForced(reply, c.kept)) allowsForced = true;
          if (allowsForced && worstChance === 0) break;
        }
        // 상대 외통수 허용 금지 > 외통수(worstChance=1) > 최악 승률 > 즉시 승률
        return (allowsForced ? 0 : 10) + worstChance + 0.01 * nextWinChance(c.board, c.kept, vision);
      },
      rng,
    ).move;
    return { move, reason: threatened ? 'block' : 'deep' };
  }

  // 3-b. 확률적으로 다음 턴 승리각 계산
  if (rng() < profile.plan)
    return { move: best(safe, (c) => nextWinChance(c.board, c.kept, vision), rng).move, reason: threatened ? 'block' : 'plan' };

  // 3-c. 계산 안 함: 안전한 수 중 아무거나
  return { move: pick(safe, rng).move, reason: threatened ? 'block' : 'casual' };
}

/** 이유별 생각 시간(ms) — 최대 3초 */
const THINK_MS: Record<Reason, [number, number]> = {
  win: [700, 1300],      // 이기는 수는 눈에 확 들어옴
  block: [900, 1800],    // 막을 곳이 보임
  casual: [800, 2000],
  plan: [1300, 2600],
  deep: [1600, 3000],
  desperate: [2200, 3000], // 어떻게 둬도 위험 → 고민
};

export const thinkTime = (reason: Reason, rng: Rng) => {
  const [a, b] = THINK_MS[reason];
  return a + rng() * (b - a);
};
