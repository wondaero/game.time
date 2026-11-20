import type { Player } from '../game/engine';
import { cls } from '../util';
import { TimerBar } from './TimerBar';

interface Props {
  player: Player;
  active: boolean;
  controllable: boolean;
  selected: number | null;
  onSelect: (idx: number) => void;
  timerRunning: boolean;
  turnStartedAt: number;
  flipped?: boolean;
  status?: string;
  result?: 'win' | 'lose' | null;
  /** 0 = 1P(호박색), 1 = 2P/AI(청록) */
  seat: 0 | 1;
}

export function PlayerPanel(p: Props) {
  return (
    <section className={cls('panel', `p${p.seat}`, p.active && 'active', p.flipped && 'flipped', p.result)}>
      <header>
        <h2>{p.player.name}</h2>
        {p.status && <span className="status">{p.status}</span>}
        <TimerBar startedAt={p.turnStartedAt} running={p.timerRunning} />
      </header>
      <div className="hand">
        {p.player.hand.map((n, i) => (
          <button
            type="button"
            key={`${i}:${n}`}
            className={cls('card', p.active && p.selected === i && 'selected')}
            disabled={!p.controllable}
            onClick={() => p.onSelect(i)}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );
}
