import realms from '../data/realms.json';
import roots from '../data/roots.json';
import branches from '../data/branches.json';
import skills from '../data/skills.json';
import statuses from '../data/statuses.json';
import enemies from '../data/enemies.json';
import items from '../data/items.json';
import recipes from '../data/recipes.json';
import quests from '../data/quests.json';
import chapters from '../data/chapters.json';
import companions from '../data/companions.json';
import services from '../data/services.json';
import systems from '../data/systems.json';
import type { Realm, Skill, StatusDef } from './types';

const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x] as const));

export const REALMS = realms as unknown as Realm[];
export const ROOTS = roots as any[];
export const BRANCHES = branches as any[];
export const SKILLS = skills as unknown as Skill[];
export const STATUSES = statuses as unknown as StatusDef[];
export const ENEMIES = enemies as any[];
export const ITEMS = items as any;
export const RECIPES = recipes as any[];
export const QUESTS = quests as any[];
export const CHAPTERS = chapters as any[];

export const skillMap = byId(SKILLS);
export const statusMap = byId(STATUSES);
export const enemyMap = byId(ENEMIES);
export const rootMap = byId(ROOTS);
export const branchMap = byId(BRANCHES);
export const recipeMap = byId(RECIPES);
export const questMap = byId(QUESTS);
export const realmMap = byId(REALMS);
export const materialMap = byId(ITEMS.materials as any[]);

export const COMPANIONS = companions as any[];
export const companionMap = byId(COMPANIONS);
export const SERVICES = services as any;
export const vendorMap = byId(SERVICES.vendors as any[]);

export const SYSTEM_NAMES = systems as Record<string, string>;
export const systemName = (id: string) => SYSTEM_NAMES[id] ?? id;
