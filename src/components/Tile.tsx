import type { Cell } from '../game/engine';
import { cls } from '../util';

export interface Pulse {
  key: number;
  added: number;
  system: boolean;
  /** 놓은 사람의 place 스킨 클래스 */
  fx: string;
  /** 놓은 사람 (색 구분용) */
  by: 0 | 1 | 'system';
}

interface Props {
  index: number;
  value: Cell;
  pulse: Pulse | null;
  win: boolean;
  look: 'glance' | 'aim' | null;
  /** 2인 모드: 트럼프 카드식 양방향 숫자 */
  corners: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function Tile({ index, value, pulse, win, look, corners, disabled, onClick }: Props) {
  /** 거꾸로 보면 헷갈리는 숫자 (우노 카드처럼 밑줄) */
  const amb = value === 6 || value === 9;
  return (
    <button
      type="button"
      className={cls('tile', value !== null && 'filled', win && 'win', pulse?.system && 'system', pulse && !pulse.system && `by-${pulse.by}`, pulse?.fx, look)}
      disabled={disabled}
      onClick={onClick}
      aria-label={`${Math.floor(index / 5) + 1}행 ${(index % 5) + 1}열: ${value ?? '빈칸'}`}
    >
      {corners ? (
        /* 트럼프 카드식: 왼쪽 위(아래 플레이어용) + 오른쪽 아래 180°(위 플레이어용), 가운데는 비움(스킨 장식 자리) */
        <>
          <span className="corner tl">
            <span key={pulse?.key ?? 'n'} className={cls('num', pulse && 'pop', amb && 'amb')}>{value ?? ''}</span>
          </span>
          <span className="corner br">
            <span key={pulse?.key ?? 'n'} className={cls('num', pulse && 'pop', amb && 'amb')}>{value ?? ''}</span>
          </span>
        </>
      ) : (
        <span key={pulse?.key ?? 'n'} className={cls('num', pulse && 'pop')}>
          {value ?? ''}
        </span>
      )}
      {pulse && (
        <span key={`f${pulse.key}`} className="float">
          +{pulse.added}
        </span>
      )}
    </button>
  );
}
