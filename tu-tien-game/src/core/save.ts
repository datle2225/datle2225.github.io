import type { PlayerState } from './types';

const KEY = 'tu-tien-game:save:v1';

export function newPlayer(name = 'Diệp Thanh'): PlayerState {
  return {
    name,
    rootId: 'tan_can',
    branchId: null,
    subBranchId: null,
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
    formations: [],
    formation: null,
    faction: null,
    law: null,
    auction: { bids: {}, news: [] },
    med: { energy: 100, at: 0 },
    seclusion: null,
    mapId: 'thanh_ha',
    pos: null,
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

/* ───────────── Xuất / nhập save (chuyển máy, sao lưu) ───────────── */
const MAGIC = 'TCNT1';

function checksum(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const toB64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const fromB64 = (s: string) => decodeURIComponent(escape(atob(s)));

/** Chuỗi một dòng có kiểm tra toàn vẹn, dán / lưu ra file đều được. */
export function exportSave(p: PlayerState): string {
  const body = toB64(JSON.stringify(p));
  return `${MAGIC}.${checksum(body)}.${body}`;
}

export function importSave(text: string): { ok: true; p: PlayerState } | { ok: false; reason: string } {
  const parts = text.trim().split('.');
  if (parts.length !== 3 || parts[0] !== MAGIC) return { ok: false, reason: 'Không phải file save của game.' };
  if (checksum(parts[2]) !== parts[1]) return { ok: false, reason: 'File save bị hỏng hoặc đã bị sửa.' };
  try {
    const raw = JSON.parse(fromB64(parts[2]));
    if (typeof raw !== 'object' || raw === null || typeof raw.realmIndex !== 'number' || typeof raw.stage !== 'number') return { ok: false, reason: 'Dữ liệu save không hợp lệ.' };
    return { ok: true, p: { ...newPlayer(), ...raw } };
  } catch {
    return { ok: false, reason: 'Không đọc được file save.' };
  }
}

/** Ghi trực tiếp vào localStorage (dùng sau khi nhập). */
export function writeSave(p: PlayerState): boolean {
  return save(p);
}
