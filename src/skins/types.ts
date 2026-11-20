/**
 * 스킨 시스템 — 게임 코드는 스킨 "ID" 만 알고, 실제 표현은 레지스트리의 데이터(CSS 변수/클래스)가 담당.
 *
 * 누가 무엇을 보나
 *  board / number : 화면을 보는 사람(viewer) 자신의 스킨 (타일에 주인이 없으므로)
 *  place          : 수를 놓은 사람의 스킨 (상대 화면에도 보임)
 *  win            : 이긴 사람의 스킨 (양쪽에 보임)
 *  lose           : 진 사람 본인 화면에서만 (상대의 패배 연출을 고르는 건 조롱이 됨)
 *
 * 원칙: 스킨은 승패에 영향을 주면 안 된다 → 숫자 스킨도 아라비아 숫자 가독성 유지.
 *       효과 길이 상한: place ≤ 600ms, win/lose ≤ 2000ms
 */

export type SkinSlot = 'board' | 'number' | 'place' | 'win' | 'lose';
export const SKIN_SLOTS: SkinSlot[] = ['board', 'number', 'place', 'win', 'lose'];

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Skin {
  id: string;
  slot: SkinSlot;
  name: string;
  rarity: Rarity;
  /** board/number: 게임 루트에 주입할 CSS 변수 */
  vars?: Record<`--${string}`, string>;
  /** place/win/lose: 효과용 CSS 클래스 (styles 에 정의) */
  className?: string;
}

/** 슬롯별 장착 스킨 ID */
export type Loadout = Record<SkinSlot, string>;

/**
 * 보유/장착 저장소. 지금은 localStorage, 나중에 Supabase(인벤토리 테이블)로 교체.
 * 상점·뽑기는 이 인터페이스 뒤에서 owned 를 늘리는 방식으로 붙인다.
 */
export interface SkinStore {
  getOwned(): Promise<string[]>;
  getLoadout(): Promise<Loadout>;
  setLoadout(loadout: Loadout): Promise<void>;
}
