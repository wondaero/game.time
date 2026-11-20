import type { GameState } from '../game/engine';
import { cls } from '../util';
import { Tile } from './Tile';

interface Props {
  state: GameState;
  interactive: boolean;
  armed: boolean;
  onTile: (idx: number) => void;
  /** AI 가 보고 있는 칸 */
  glance?: number | null;
  aiming?: boolean;
  /** 플레이어별 놓기 효과 클래스 */
  placeFx?: [string, string];
  /** 승자의 승리 효과 클래스 */
  winFx?: string;
  /** 2인 모드: 트럼프 카드식 양방향 숫자 */
  corners?: boolean;
}

export function Board({ state, interactive, armed, onTile, glance = null, aiming = false, placeFx = ['', ''], winFx = '', corners = false }: Props) {
  const winSet = new Set(state.winLines.flat());
  const placed = new Map(state.placements.map((p) => [p.tileIdx, p]));

  return (
    <div className="board-wrap">
      <div className="bezel">
      <div className={cls('board', armed && 'armed', state.winner !== null && 'over', winFx, corners && 'corners', corners && state.winner === null && `turn-${state.turn}`)}>
        {state.board.map((v, i) => {
          const p = placed.get(i);
          return (
            <Tile
              key={i}
              index={i}
              value={v}
              pulse={p ? { key: state.seq, added: p.added, system: p.by === 'system', by: p.by, fx: p.by === 'system' ? 'fx-place-pop' : placeFx[p.by] } : null}
              win={winSet.has(i)}
              corners={corners}
              look={glance === i ? (aiming ? 'aim' : 'glance') : null}
              disabled={!interactive}
              onClick={() => onTile(i)}
            />
          );
        })}
      </div>
      </div>
    </div>
  );
}

