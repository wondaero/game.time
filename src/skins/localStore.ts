import { DEFAULT_LOADOUT, allSkins } from './registry';
import type { Loadout, SkinStore } from './types';

const KEY = 'game-time.loadout';

/** 임시 저장소: 기본 스킨은 모두 보유, 장착 정보만 localStorage. (Supabase 연동 시 교체) */
export const localSkinStore: SkinStore = {
  async getOwned() {
    return allSkins().filter((s) => s.rarity === 'common').map((s) => s.id);
  },
  async getLoadout() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULT_LOADOUT, ...JSON.parse(raw) } : DEFAULT_LOADOUT;
    } catch {
      return DEFAULT_LOADOUT;
    }
  },
  async setLoadout(loadout: Loadout) {
    try {
      localStorage.setItem(KEY, JSON.stringify(loadout));
    } catch {
      /* 저장 불가 환경은 무시 */
    }
  },
};
