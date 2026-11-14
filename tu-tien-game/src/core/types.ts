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
  target: 'enemy' | 'self' | 'ally';
  hits?: number;
  gives?: string;
  requires?: string;
  requiresOn?: 'self' | 'target';
  bonus?: number;
  heal?: number;
  lifesteal?: number;
  cd?: number; // hồi chiêu: số lần hành động của chính người dùng trước khi dùng lại
  summon?: string; // id linh thú triệu hồi (Ngự Thú Tu)
  pick?: 'beast'; // chiêu 'ally' nhắm vào linh thú
  advance?: number; // kéo lượt hành động của mục tiêu (đồng đội) lên sớm
  delay?: number; // đẩy lượt hành động của đối thủ lùi lại
  hpCost?: number; // hy sinh % HP tối đa khi dùng (Ma Tu)
  desc: string;
}

export interface StatusDef {
  id: string;
  name: string;
  kind: 'buff' | 'debuff' | 'dot' | 'trap';
  duration: number;
  defMul?: number;
  spdMul?: number;
  dotPct?: number;
  dotAtk?: number; // DoT theo Công của người gây (không phình theo HP mục tiêu → không bẻ cân bằng boss)
  trapAtk?: number;
  damageTakenMul?: number;
  trapPct?: number; // bẫy: nổ khi chủ thể hành động, gây % HP tối đa
  trapDelay?: number; // và đẩy lượt kế tiếp lùi thêm
}

export interface Realm {
  id: string;
  name: string;
  stages: number;
  lifespan: number;
  expPerStage: number[];
  statMul: number;
  bottlenecks?: number[];
  ascension?: { waves: number; boltPower: number; recommendedPower: number; name: string };
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

export interface ShopState {
  day: number;
  stock: Record<string, number>; // id nguyên liệu/đan/thời trang -> còn lại
  items: ItemInstance[]; // đồ rèn sẵn
}

export interface PlayerState {
  name: string;
  rootId: string;
  branchId: string | null;
  subBranchId: string | null; // nhánh phụ (học thêm từ Kết Đan / Nguyên Anh)
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
  difficulty: 'normal' | 'hard' | 'nightmare'; // độ khó
  ngPlus: number; // chu kỳ chơi lại (0 = lần đầu)
  counters: Record<string, number>; // thống kê: kills, boss_kills, deaths, crafted, quests_done, pills_used, tower_floors
  achievements: string[]; // thành tựu đã mở
  towerBest: number; // tầng cao nhất ở Vô Tận Tháp
  dynQuests: Record<string, any>; // nhiệm vụ sinh động (bảng nhiệm vụ)
  bountyAccepted: Record<string, boolean>; // id bảng nhiệm vụ đã nhận (chống nhận lại)
  visited: string[]; // bản đồ đã tới (truyền tống)
  formations: string[]; // trận pháp đã học
  formation: string | null; // trận đang bày
  faction: { id: string; points: number; lastClaim: number } | null; // thế lực
  law: string | null; // pháp tắc (Hóa Thần)
  auction: { bids: Record<string, number>; news: string[] }; // giá đặt tối đa đang giữ cọc, tin kết quả
  med: { energy: number; at: number }; // tâm lực (0..100) và mốc thời gian hồi
  seclusion: { startedAt: number; aura: number } | null; // bế quan (tu luyện khi rời game)
  mapId: string;
  pos: { x: number; y: number } | null;
  rep: Record<string, number>; // danh vọng phe: chinh_dao, ma_dao, tan_tu
  relations: Record<string, number>; // quan hệ NPC 0..100
  party: string[]; // id đồng hành đang theo
  shops: Record<string, ShopState>;
}
