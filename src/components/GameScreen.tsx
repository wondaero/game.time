import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { PlayerId } from '../game/engine';
import { useGame, type GameMode } from '../hooks/useGame';
import { DEFAULT_LOADOUT, resolveSkinView } from '../skins/registry';
import { useLoadout } from '../skins/useLoadout';
import { cls } from '../util';
import { Board } from './Board';
import { PlayerPanel } from './PlayerPanel';

interface Props {
  mode: GameMode;
  onExit: () => void;
}

export function GameScreen({ mode, onExit }: Props) {
  const g = useGame(mode);
  const { state } = g;
  const local = mode.kind === 'local';
  const [showResult, setShowResult] = useState(false);

  // 스킨: 연습모드 AI 는 기본 스킨, 한 폰 2인은 기기 주인 스킨 공용. (온라인에서는 상대 loadout 을 서버에서 받음)
  const mine = useLoadout();
  const skin = useMemo(
    () => resolveSkinView(mine, [mine, local ? mine : DEFAULT_LOADOUT]),
    [mine, local],
  );
  const viewerLost = mode.kind === 'practice' && state.winner === 1;

  useEffect(() => {
    if (state.winner === null) {
      setShowResult(false);
      return;
    }
    const id = window.setTimeout(() => setShowResult(true), 1200);
    return () => clearTimeout(id);
  }, [state.winner]);

  const statusFor = (active: boolean, human: boolean) => {
    if (!active) return undefined;
    if (!human) return g.ai.phase === 'aiming' ? '여기다!' : g.ai.card !== null ? '결정했어요' : g.ai.phase === 'thinking' ? '생각 중…' : undefined;
    return g.canAct && g.selected === null ? '카드를 고르세요' : undefined;
  };

  const panel = (id: PlayerId) => {
    const active = state.turn === id && state.winner === null;
    const human = !g.isAI(id);
    return (
      <PlayerPanel
        seat={id}
        player={state.players[id]}
        active={active}
        controllable={active && human && g.canAct}
        selected={human ? g.selected : g.ai.card}
        onSelect={g.selectCard}
        timerRunning={active && human && !g.busy}
        turnStartedAt={g.turnStartedAt}
        flipped={local && id === 1}
        status={statusFor(active, human)}
        result={state.winner === null ? null : state.winner === id ? 'win' : 'lose'}
      />
    );
  };

  const resultTitle =
    state.winner === null ? '' : mode.kind === 'practice' ? (state.winner === 0 ? '승리!' : '패배…') : `${state.players[state.winner].name} 승리!`;

  return (
    <div className={`game ${mode.kind}`} style={skin.vars as CSSProperties}>
      <nav className="game-nav">
        <button type="button" className="ghost" onClick={onExit}>
          ← 메뉴
        </button>
        <span className="move-count">{state.moveCount}수</span>
      </nav>

      {panel(1)}
      <Board state={state} interactive={g.canAct} armed={g.canAct && g.selected !== null} onTile={g.placeAt} glance={g.ai.glance} aiming={g.ai.phase === 'aiming'} placeFx={skin.placeFx} winFx={state.winner === null ? '' : skin.winFx(state.winner)} corners={local} />
      {panel(0)}

      {g.toast && <div className="toast">{g.toast}</div>}

      {showResult && (
        <div className="overlay">
          <div className={cls('result-card', local && state.winner === 1 && 'flipped', viewerLost && skin.loseFx)}>
            <p className="result-title">{resultTitle}</p>
            <p className="result-sub">{state.moveCount}수 만에 결판</p>
            <div className="actions">
              <button type="button" className="primary" onClick={g.restart}>
                다시 하기
              </button>
              <button type="button" onClick={onExit}>
                메뉴로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
