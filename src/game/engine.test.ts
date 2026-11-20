import { describe, expect, it } from 'vitest';
import {
  LINES, addClock, applyMove, createGame, forcedPlacement, isWinningTriple, winLinesAt,
  type Cell, type GameState, type PlayerId, type Rng,
} from './engine';
import { FULL_VISION, chooseMove, seesWin, type Difficulty, type Vision } from './ai';

/** 재현 가능한 난수 */
const seeded = (seed: number): Rng => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const emptyBoard = (): Cell[] => Array(25).fill(null);

describe('engine', () => {
  it('12시간 시계 덧셈', () => {
    expect(addClock(null, 7)).toBe(7);
    expect(addClock(9, 5)).toBe(2);
    expect(addClock(5, 7)).toBe(12);
    expect(addClock(12, 12)).toBe(12);
    expect(addClock(12, 1)).toBe(1);
  });

  it('라인 48개', () => expect(LINES.length).toBe(48));

  it('승리 패턴', () => {
    expect(isWinningTriple(3, 3, 3)).toBe(true);
    expect(isWinningTriple(3, 4, 5)).toBe(true);
    expect(isWinningTriple(8, 7, 6)).toBe(true);
    expect(isWinningTriple(11, 12, 1)).toBe(false);
    expect(isWinningTriple(3, 5, 7)).toBe(false);
    expect(isWinningTriple(3, null, 3)).toBe(false);
  });

  it('대각선 / 여러 줄 동시 승리 모두 감지', () => {
    const b = emptyBoard();
    b[0] = 5; b[6] = 6; b[12] = 7; // ↘ 대각
    b[10] = 7; b[11] = 7;          // 가로
    expect(winLinesAt(b, 12)).toHaveLength(2);
  });

  it('applyMove: 카드 교체, 턴 전환, 승리', () => {
    const rng = seeded(1);
    let s: GameState = createGame(['a', 'b'], rng, 0);
    s = { ...s, players: [{ name: 'a', hand: [4, 4, 4] }, { name: 'b', hand: [4, 4, 4] }] };
    s = applyMove(s, { cardIdx: 0, tileIdx: 0 }, rng);
    expect(s.turn).toBe(1);
    expect(s.board[0]).toBe(4);
    s = applyMove(s, { cardIdx: 1, tileIdx: 1 }, rng);
    s = { ...s, players: [{ name: 'a', hand: [4, 1, 1] }, s.players[1]] };
    s = applyMove(s, { cardIdx: 0, tileIdx: 2 }, rng);
    expect(s.winner).toBe(0);
    expect(s.winLines).toEqual([[0, 1, 2]]);
    expect(applyMove(s, { cardIdx: 0, tileIdx: 5 }, rng)).toBe(s); // 종료 후 무시
  });

  it('정체 시 강제 배치는 절대 승리를 만들지 않음', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = seeded(seed);
      const b = emptyBoard();
      b[12] = (seed % 12) + 1;
      const f = forcedPlacement(b, rng)!;
      expect(f).not.toBeNull();
      expect(b[f.tileIdx]).toBeNull();
      b[f.tileIdx] = f.value;
      expect(winLinesAt(b, f.tileIdx)).toHaveLength(0);
    }
  });

  it('한 칸에만 쌓으면 강제 배치 발생', () => {
    const rng = seeded(3);
    let s = createGame(['a', 'b'], rng, 0);
    for (let i = 0; i < 5; i++) s = applyMove(s, { cardIdx: 0, tileIdx: 12 }, rng);
    expect(s.placements.some((p) => p.by === 'system')).toBe(true);
  });
});

describe('ai 시야', () => {
  const v = (o: Partial<Vision>): Vision => ({ ...FULL_VISION, ...o });

  it('역방향을 못 보면 321 승리를 인식하지 못함', () => {
    const b = emptyBoard();
    b[0] = 3; b[1] = 2; // 3 2 _ → 1 을 놓으면 321
    expect(seesWin(v({ desc: false }), b, 2, 1)).toBe(false);
    expect(seesWin(v({}), b, 2, 1)).toBe(true);
    b[0] = 1; b[1] = 2; // 정방향은 보임
    expect(seesWin(v({ desc: false }), b, 2, 3)).toBe(true);
  });

  it('대각선을 못 보면 대각 승리를 인식하지 못함', () => {
    const b = emptyBoard();
    b[0] = 7; b[6] = 7;
    expect(seesWin(v({ diag: false }), b, 12, 7)).toBe(false);
    expect(seesWin(v({}), b, 12, 7)).toBe(true);
  });

  it('같은 숫자를 못 보면 333을 인식하지 못함', () => {
    const b = emptyBoard();
    b[0] = 5; b[1] = 5;
    expect(seesWin(v({ same: false }), b, 2, 5)).toBe(false);
  });

  it('초고수는 이길 수 있으면 반드시 이긴다', () => {
    const rng = seeded(7);
    const base = createGame(['a', 'b'], rng, 0);
    const board = emptyBoard();
    board[0] = 3; board[6] = 2; // ↘ 대각 역방향: 12번에 1 → 321
    const s: GameState = { ...base, board, players: [{ name: 'a', hand: [9, 1, 9] }, { name: 'b', hand: [4, 4, 4] }] };
    for (let i = 0; i < 20; i++) expect(applyMove(s, chooseMove(s, 'master', rng), rng).winner).toBe(0);
  });
});

describe('ai 난이도', () => {
  const play = (a: Difficulty, b: Difficulty, seed: number) => {
    const rng = seeded(seed);
    let s = createGame(['a', 'b'], rng);
    const ais: Record<PlayerId, Difficulty> = { 0: a, 1: b };
    while (s.winner === null && s.moveCount < 200) s = applyMove(s, chooseMove(s, ais[s.turn], rng), rng);
    return s.winner;
  };

  /** 선공 편향 제거를 위해 자리를 번갈아 가며 a 의 승률 계산 */
  const winRate = (a: Difficulty, b: Difficulty, n: number) => {
    let w = 0;
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) w += play(a, b, 1000 + i) === 0 ? 1 : 0;
      else w += play(b, a, 1000 + i) === 1 ? 1 : 0;
    }
    return w / n;
  };

  it('위 난이도가 아래 난이도를 이긴다', () => {
    const r = {
      '중급>초보': winRate('intermediate', 'beginner', 100),
      '고수>중급': winRate('advanced', 'intermediate', 100),
      '초고수>고수': winRate('master', 'advanced', 40),
    };
    console.log(r);
    for (const rate of Object.values(r)) expect(rate).toBeGreaterThan(0.5);
  }, 300_000);

  it('초고수 한 수 계산 시간', () => {
    const rng = seeded(11);
    let worst = 0;
    for (let g = 0; g < 3; g++) {
      let s = createGame(['a', 'b'], rng);
      while (s.winner === null && s.moveCount < 30) {
        const t = performance.now();
        const m = chooseMove(s, 'master', rng);
        worst = Math.max(worst, performance.now() - t);
        s = applyMove(s, m, rng);
      }
    }
    console.log('master worst move ms', worst.toFixed(1));
    expect(worst).toBeLessThan(1500);
  }, 120_000);
});
