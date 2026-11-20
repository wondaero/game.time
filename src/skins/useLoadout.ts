import { useEffect, useState } from 'react';
import { localSkinStore } from './localStore';
import { DEFAULT_LOADOUT } from './registry';
import type { Loadout, SkinStore } from './types';

/** 이 기기 사용자의 장착 스킨 */
export function useLoadout(store: SkinStore = localSkinStore): Loadout {
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT);
  useEffect(() => {
    let alive = true;
    store.getLoadout().then((l) => alive && setLoadout(l));
    return () => {
      alive = false;
    };
  }, [store]);
  return loadout;
}
