import { useEffect, useRef } from 'react';
import { TURN_MS } from '../game/engine';

interface Props {
  startedAt: number;
  running: boolean;
  duration?: number;
}

/** rAF 로 DOM 을 직접 갱신 (매 프레임 리렌더 방지) */
export function TimerBar({ startedAt, running, duration = TURN_MS }: Props) {
  const fill = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = fill.current;
    const lb = label.current;
    if (!el || !lb) return;
    if (!running) {
      el.style.transform = 'scaleX(0)';
      el.classList.remove('danger');
      lb.textContent = '';
      return;
    }
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, duration - (performance.now() - startedAt));
      el.style.transform = `scaleX(${left / duration})`;
      el.classList.toggle('danger', left <= 10_000);
      lb.textContent = String(Math.ceil(left / 1000));
      if (left > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [startedAt, running, duration]);

  return (
    <div className="timer">
      <div className="timer-track">
        <div ref={fill} className="timer-fill" />
      </div>
      <span ref={label} className="timer-label" />
    </div>
  );
}
