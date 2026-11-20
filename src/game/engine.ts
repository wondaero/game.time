/**
 * 「시간에 갇힌 자」 게임 엔진 — 순수 함수만 존재 (UI/네트워크 무관).
 * 온라인 대전 시에도 같은 엔진을 그대로 사용하고, 난수(rng)만 서버/호스트가 주입하면 된다.
 *
 * 규칙
 *  - 5x5 보드, 각 플레이어는 1~12 카드 3장.
 *  - 카드 1장을 타일에 놓으면 타일 값 = (기존값 + 카드) 를 12시간 시계로 계산 (빈칸이면 카드값).
 *  - 사용한 카드는 새 랜덤 카드로 교체되고 턴이 넘어간다.
 *  - 가로/세로/대각선 3칸이 같은 숫자이거나 1씩 연속(오름/내림)이면 승리. (12→1은 연속 아님)
 *  - 한 곳에만 계속 쌓아 판이 진행되지 않으면, 시스템이 승리를 만들지 않는 숫자를 빈칸에 강제로 배치.
 */

export const SIZE = 5;
export const TILE_COUNT = SIZE * SIZE;
export const HAND_SIZE = 3;
export const MAX_NUM = 12;
export const TURN_MS = 60_000;

export type PlayerId = 0 | 1;
export type Cell = number | null;
export type Rng = () => number;

export interface Player {
  name: string;
  hand: number[];
}

export interface Move {
  cardIdx: number;
  tileIdx: number;
}

export interface Placement {
  tileIdx: number;
  added: number;
  value: number;
  by: PlayerId | 'system';
}

export interface GameState {
  board: Cell[];
  players: [Player, Player];
  turn: PlayerId;
  moveCount: number;
  winner: PlayerId | null;
  winLines: number[][];
  /** 직전 applyMove 에서 놓인 타일들 (연출용) */
  placements: Placement[];
  /** applyMove 마다 증가 (연출 key) */
  seq: number;
}

/* ---------- utils ---------- */

export const randInt = (rng: Rng, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;
export const pick = <T>(arr: readonly T[], rng: Rng): T => arr[randInt(rng, 0, arr.length - 1)];
export const drawCard = (rng: Rng) => randInt(rng, 1, MAX_NUM);
export const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);
export const addClock = (cur: Cell, n: number) =>
  cur === null ? n : ((cur + n - 1) % MAX_NUM) + 1;

/* ---------- lines ---------- */

type Line = readonly [number, number, number];
const at = (r: number, c: number) => r * SIZE + c;
const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** 보드 위 가능한 모든 3칸 라인 (가로 15 + 세로 15 + 대각 18 = 48) */
export const LINES: readonly Line[] = (() => {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  const lines: Line[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      for (const [dr, dc] of dirs)
        if (inBounds(r + 2 * dr, c + 2 * dc))
          lines.push([at(r, c), at(r + dr, c + dc), at(r + 2 * dr, c + 2 * dc)]);
  return lines;
})();

export const LINES_BY_TILE: readonly (readonly Line[])[] = Array.from({ length: TILE_COUNT }, (_, t) =>
  LINES.filter((l) => l.includes(t)),
);

export function isWinningTriple(a: Cell, b: Cell, c: Cell): boolean {
  if (a === null || b === null || c === null) return false;
  const d = b - a;
  return (d === 0 || d === 1 || d === -1) && c - b === d;
}

export function winLinesAt(board: readonly Cell[], tileIdx: number): number[][] {
  return LINES_BY_TILE[tileIdx]
    .filter(([a, b, c]) => isWinningTriple(board[a], board[b], board[c]))
    .map((l) => [...l]);
}

/** tileIdx 에 value 가 놓이면 승리하는지. board 를 잠깐 변경 후 원복한다. */
export function wouldWin(board: Cell[], tileIdx: number, value: number): boolean {
  const prev = board[tileIdx];
  board[tileIdx] = value;
  let win = false;
  for (const [a, b, c] of LINES_BY_TILE[tileIdx]) {
    if (isWinningTriple(board[a], board[b], board[c])) {
      win = true;
      break;
    }
  }
  board[tileIdx] = prev;
  return win;
}

/* ---------- stall (강제 배치) ---------- */

/** N수 이후에도 채워진 타일이 M개 미만이면 정체로 판단 */
const STALL_RULES = [
  { afterMoves: 5, minFilled: 2 },
  { afterMoves: 9, minFilled: 3 },
  { afterMoves: 17, minFilled: 4 },
];

export function isStalled(board: readonly Cell[], moveCount: number): boolean {
  const filled = board.filter((v) => v !== null).length;
  return STALL_RULES.some((r) => moveCount >= r.afterMoves && filled < r.minFilled);
}

/** 기존 숫자들과 ±1 이내가 아닌 숫자를, 이웃이 가장 많은 빈칸에 배치 (승리 불가 보장) */
export function forcedPlacement(board: Cell[], rng: Rng): Placement | null {
  const filled = board.filter((v): v is number => v !== null);
  const nums = Array.from({ length: MAX_NUM }, (_, i) => i + 1).filter((n) =>
    filled.every((f) => Math.abs(f - n) > 1),
  );
  if (!nums.length) return null;

  const neighbors = (t: number) => {
    const r = Math.floor(t / SIZE), c = t % SIZE;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if ((dr || dc) && inBounds(r + dr, c + dc) && board[at(r + dr, c + dc)] !== null) n++;
    return n;
  };
  const empties = board.flatMap((v, i) => (v === null ? [i] : []));
  if (!empties.length) return null;
  const best = Math.max(...empties.map(neighbors));
  const tiles = empties.filter((t) => neighbors(t) === best);

  const options = tiles.flatMap((t) => nums.filter((n) => !wouldWin(board, t, n)).map((n) => [t, n] as const));
  if (!options.length) return null;
  const [tileIdx, value] = pick(options, rng);
  return { tileIdx, added: value, value, by: 'system' };
}

/* ---------- game ---------- */

export function createGame(names: [string, string], rng: Rng, first?: PlayerId): GameState {
  const hand = () => Array.from({ length: HAND_SIZE }, () => drawCard(rng));
  return {
    board: Array<Cell>(TILE_COUNT).fill(null),
    players: [
      { name: names[0], hand: hand() },
      { name: names[1], hand: hand() },
    ],
    turn: first ?? (randInt(rng, 0, 1) as PlayerId),
    moveCount: 0,
    winner: null,
    winLines: [],
    placements: [],
    seq: 0,
  };
}

export function isValidMove(state: GameState, move: Move): boolean {
  return (
    state.winner === null &&
    Number.isInteger(move.cardIdx) && move.cardIdx >= 0 && move.cardIdx < HAND_SIZE &&
    Number.isInteger(move.tileIdx) && move.tileIdx >= 0 && move.tileIdx < TILE_COUNT
  );
}

export function applyMove(state: GameState, move: Move, rng: Rng): GameState {
  if (!isValidMove(state, move)) return state;

  const me = state.turn;
  const player = state.players[me];
  const card = player.hand[move.cardIdx];

  const board = state.board.slice();
  const value = addClock(board[move.tileIdx], card);
  board[move.tileIdx] = value;
  const placements: Placement[] = [{ tileIdx: move.tileIdx, added: card, value, by: me }];

  const hand = player.hand.slice();
  hand[move.cardIdx] = drawCard(rng);
  const players = state.players.slice() as [Player, Player];
  players[me] = { ...player, hand };

  const moveCount = state.moveCount + 1;
  const base = { ...state, board, players, moveCount, placements, seq: state.seq + 1 };

  const winLines = winLinesAt(board, move.tileIdx);
  if (winLines.length) return { ...base, winner: me, winLines };

  if (isStalled(board, moveCount)) {
    const forced = forcedPlacement(board, rng);
    if (forced) {
      board[forced.tileIdx] = forced.value;
      placements.push(forced);
    }
  }

  return { ...base, turn: other(me), winLines: [] };
}

export function randomMove(rng: Rng): Move {
  return { cardIdx: randInt(rng, 0, HAND_SIZE - 1), tileIdx: randInt(rng, 0, TILE_COUNT - 1) };
}
