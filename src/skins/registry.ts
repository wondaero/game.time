import type { PlayerId } from '../game/engine';
import type { Loadout, Skin, SkinSlot } from './types';

/** 기본 스킨 (현재 디자인). 새 스킨은 여기에 추가 + styles 에 클래스 정의 */
const SKINS: Skin[] = [
  {
    id: 'board.midnight',
    slot: 'board',
    name: '자정',
    rarity: 'common',
    vars: {
      '--tile': '#141130',
      '--tile-filled': '#221c4c',
      '--tile-border': 'rgba(244, 239, 228, 0.1)',
      '--board-bg': 'rgba(10, 8, 26, 0.9)',
    },
  },
  {
    id: 'number.classic',
    slot: 'number',
    name: '클래식',
    rarity: 'common',
    vars: { '--num-font': "'Outfit', Pretendard, sans-serif", '--num-color': '#f4efe4', '--num-weight': '700' },
  },
  { id: 'place.pop', slot: 'place', name: '팝', rarity: 'common', className: 'fx-place-pop' },
  { id: 'win.gold', slot: 'win', name: '골드', rarity: 'common', className: 'fx-win-gold' },
  { id: 'lose.fade', slot: 'lose', name: '페이드', rarity: 'common', className: 'fx-lose-fade' },
];

const BY_ID = new Map(SKINS.map((s) => [s.id, s]));

export const DEFAULT_LOADOUT: Loadout = {
  board: 'board.midnight',
  number: 'number.classic',
  place: 'place.pop',
  win: 'win.gold',
  lose: 'lose.fade',
};

export const allSkins = () => SKINS;

/** 없는/잘못된 ID 는 기본 스킨으로 대체 */
export function getSkin(slot: SkinSlot, id: string | undefined): Skin {
  const s = id ? BY_ID.get(id) : undefined;
  return s && s.slot === slot ? s : BY_ID.get(DEFAULT_LOADOUT[slot])!;
}

/** 한 화면(viewer)에서 실제로 적용될 스킨 결정 */
export interface SkinView {
  vars: Record<string, string>;
  placeFx: [string, string];
  winFx: (winner: PlayerId) => string;
  loseFx: string;
}

export function resolveSkinView(viewer: Loadout, players: [Loadout, Loadout]): SkinView {
  const fx = (slot: SkinSlot, l: Loadout) => getSkin(slot, l[slot]).className ?? '';
  return {
    vars: { ...getSkin('board', viewer.board).vars, ...getSkin('number', viewer.number).vars },
    placeFx: [fx('place', players[0]), fx('place', players[1])],
    winFx: (winner) => fx('win', players[winner]),
    loseFx: fx('lose', viewer),
  };
}
