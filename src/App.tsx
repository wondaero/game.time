import { useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { Home } from './components/Home';
import type { GameMode } from './hooks/useGame';

export function App() {
  const [mode, setMode] = useState<GameMode | null>(null);

  if (!mode)
    return (
      <Home
        onPractice={(difficulty) => setMode({ kind: 'practice', difficulty })}
        onLocal={() => setMode({ kind: 'local' })}
      />
    );

  return <GameScreen mode={mode} onExit={() => setMode(null)} />;
}
