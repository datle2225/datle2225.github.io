export type Element = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho' | 'none';
export type StatKey = 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'crit';
export type Stats = Record<StatKey, number>;

export interface Skill {
  id: string;
  name: string;
  branch: string;
  unlockRealm: string;
  unlockStage: number;
  element: Element;
  power: number;
  mp: number;
  cost: number; // "độ trễ" hành động: càng nhỏ càng nhanh
  target: 'enemy' | 'self';
  hits?: number;
  gives?: string;
  requires?: string;
  requiresOn?: 'self' | 'target';
  bonus?: number;
  heal?: number;
  lifesteal?: number;
  desc: string;
}

export interface StatusDef {
  id: string;
  name: string;
  kind: 'buff' | 'debuff' | 'dot';
  duration: number;
  defMul?: number;
  spdMul?: number;
  dotPct?: number;
  damageTakenMul?: number;
}

export interface Realm {
  id: string;
  name: string;
  stages: number;
  lifespan: number;
  expPerStage: number[];
  statMul: number;
  tribulation: null | { waves: number; boltPower: number; recommendedPower: number; name: string };
  unlocks: string[];
}

export interface ItemInstance {
  uid: string;
  baseId: string;
  name: string;
  slot: string;
  rarity: string;
  stats: Partial<Stats>;
  affixes: { id: string; stat: StatKey; value: number }[];
}

export interface PlayerState {
  name: string;
  rootId: string;
  branchId: string | null;
  realmIndex: number;
  stage: number; // 1..stages
  exp: number;
  daoHeart: number; // đạo tâm 0..100
  gold: number; // linh thạch
  premium: number; // tiền nạp (chỉ mua thời trang / tiện ích)
  inventory: Record<string, number>;
  gear: ItemInstance[];
  equipped: Record<string, string | null>; // slot -> uid
  fashion: { owned: string[]; worn: Record<string, string | null> };
  knownRecipes: string[];
  comboPresets: string[][]; // mỗi preset là chuỗi id chiêu
  activeCombo: number;
  unlockedSystems: string[];
  quests: { active: string[]; done: string[]; progress: Record<string, number> };
  flags: Record<string, boolean | number | string>;
  chapter: number;
  playtime: number;
}
