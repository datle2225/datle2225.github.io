import type { PlayerState } from './types';

const KEY = 'tu-tien-game:save:v1';

export function newPlayer(name = 'Diệp Thanh'): PlayerState {
  return {
    name,
    rootId: 'tan_can',
    branchId: null,
    realmIndex: 0,
    stage: 1,
    exp: 0,
    daoHeart: 50,
    gold: 20,
    premium: 0,
    inventory: { hoi_huyet_dan: 1 },
    gear: [],
    equipped: {},
    fashion: { owned: [], worn: {} },
    knownRecipes: [],
    comboPresets: [['kiem_co_ban'], [], []],
    activeCombo: 0,
    unlockedSystems: ['di_chuyen', 'doi_thoai'],
    quests: { active: ['m1_1'], done: [], progress: {} },
    flags: {},
    chapter: 1,
    playtime: 0,
    rep: { chinh_dao: 0, ma_dao: 0, tan_tu: 0 },
    relations: {},
    party: [],
    shops: {},
  };
}

export function save(p: PlayerState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, p }));
    return true;
  } catch {
    return false;
  }
}

export function load(): PlayerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.v === 1 ? { ...newPlayer(), ...d.p } : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}
