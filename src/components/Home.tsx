import { useState } from 'react';
import { DIFFICULTIES, type Difficulty } from '../game/ai';

interface Props {
  onPractice: (d: Difficulty) => void;
  onLocal: () => void;
}

export function Home({ onPractice, onLocal }: Props) {
  const [picking, setPicking] = useState(false);

  return (
    <main className="home">
      <div className="logo" aria-hidden>
        <span className="logo-hand h" />
        <span className="logo-hand m" />
      </div>
      <h1>시간에 갇힌 자</h1>
      <p className="tagline">12시간의 시계로 3칸을 맞춰라</p>

      {!picking ? (
        <div className="menu">
          <button type="button" className="primary" onClick={() => setPicking(true)}>
            연습 모드
            <small>AI와 1:1</small>
          </button>
          <button type="button" onClick={onLocal}>
            둘이서 한 폰으로
            <small>마주 보고 대결</small>
          </button>
          <button type="button" disabled>
            온라인 대전
            <small>준비 중</small>
          </button>
        </div>
      ) : (
        <div className="menu">
          {DIFFICULTIES.map((d) => (
            <button type="button" key={d.id} onClick={() => onPractice(d.id)}>
              {d.label}
              <small>{d.desc}</small>
            </button>
          ))}
          <button type="button" className="ghost" onClick={() => setPicking(false)}>
            ← 뒤로
          </button>
        </div>
      )}

      <details className="rules">
        <summary>게임 규칙</summary>
        <ul>
          <li>카드를 고르고 칸을 누르면, 그 칸의 숫자에 카드 숫자가 <b>시계처럼</b> 더해집니다. (9 + 5 = 2)</li>
          <li>가로·세로·대각선 3칸이 <b>같은 숫자</b>이거나 <b>연속 숫자</b>(3·4·5, 8·7·6)가 되면 승리. 12→1은 연속이 아닙니다.</li>
          <li>사용한 카드는 새 카드로 바뀝니다. 한 턴은 60초, 시간이 지나면 자동으로 둡니다.</li>
          <li>한 칸에만 계속 쌓으면 시간이 뒤틀려 빈칸에 숫자가 생깁니다.</li>
        </ul>
      </details>
    </main>
  );
}
