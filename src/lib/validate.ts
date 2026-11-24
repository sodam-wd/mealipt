/**
 * 신뢰할 수 없는 입력(공유 링크, LocalStorage)을 검증/정제하는 손수 작성 스키마 검증기.
 * 알 수 없는 키는 버리고, 새 객체를 만들어 반환한다. 실패 시 null.
 */
import {
  CATEGORIES,
  DINING_MODES,
  FLAVORS,
  INGREDIENTS,
  REJECTION_CODES,
  type Category,
  type FinalReceipt,
  type Flavor,
  type Ingredient,
  type Level3,
  type ProfileReceipt,
  type Receipt,
  type RejectionCode,
  type ShareProfile,
} from '@/types';

export const LIMITS = {
  nickname: 12,
  groupLabel: 16,
  id: 64,
  menuId: 64,
  menuName: 40,
  avoidMenus: 40,
  sourceSheetIds: 10,
  maxBudget: 1_000_000,
  maxRound: 999,
} as const;

const CONTROL_CHARS = new RegExp(
  '[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069\\ufeff]',
  'g',
);

/** 제어문자/방향 제어 문자 제거, 공백 정리, 길이 제한(코드포인트 기준). */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
  return Array.from(cleaned).slice(0, max).join('');
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

/** 엄격: 문자열이 비어있지 않고 길이 이내이며 제어문자가 없어야 한다. */
function strictId(v: unknown, max: number): string | null {
  if (!isStr(v) || v.length === 0 || v.length > max) return null;
  if (v !== cleanText(v, max)) return null;
  return v;
}

function strictEnumArray<T extends string>(v: unknown, allowed: readonly T[], maxLen: number): T[] | null {
  if (!Array.isArray(v) || v.length > maxLen) return null;
  const out: T[] = [];
  for (const item of v) {
    if (!isStr(item) || !(allowed as readonly string[]).includes(item)) return null;
    if (!out.includes(item as T)) out.push(item as T);
  }
  return out;
}

/** 관대: 허용되지 않은 값은 버린다(입력 폼 -> 프로필 변환용). */
export function pickEnums<T extends string>(v: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (isStr(item) && (allowed as readonly string[]).includes(item) && !out.includes(item as T)) out.push(item as T);
  }
  return out;
}

const DINING_ALL = ['any', ...DINING_MODES] as const;

export function parseShareProfile(raw: unknown): ShareProfile | null {
  if (!isObj(raw)) return null;
  const id = strictId(raw.id, LIMITS.id);
  if (!id) return null;
  let name: string | undefined;
  if (raw.name !== undefined && raw.name !== null) {
    if (!isStr(raw.name) || Array.from(raw.name).length > LIMITS.nickname) return null;
    name = cleanText(raw.name, LIMITS.nickname) || undefined;
  }
  if (!isStr(raw.diningMode) || !(DINING_ALL as readonly string[]).includes(raw.diningMode)) return null;
  const diningMode = raw.diningMode as ShareProfile['diningMode'];

  let budget: number | null;
  if (raw.budget === null) budget = null;
  else if (
    typeof raw.budget === 'number' &&
    Number.isInteger(raw.budget) &&
    raw.budget >= 0 &&
    raw.budget <= LIMITS.maxBudget
  )
    budget = raw.budget;
  else return null;

  let fullness: Level3 | null;
  if (raw.fullness === null) fullness = null;
  else if (raw.fullness === 1 || raw.fullness === 2 || raw.fullness === 3) fullness = raw.fullness;
  else return null;

  const preferredCategories = strictEnumArray<Category>(raw.preferredCategories, CATEGORIES, CATEGORIES.length);
  const preferredFlavors = strictEnumArray<Flavor>(raw.preferredFlavors, FLAVORS, FLAVORS.length);
  const avoidIngredients = strictEnumArray<Ingredient>(raw.avoidIngredients, INGREDIENTS, INGREDIENTS.length);
  if (!preferredCategories || !preferredFlavors || !avoidIngredients) return null;

  if (!Array.isArray(raw.avoidMenus) || raw.avoidMenus.length > LIMITS.avoidMenus) return null;
  const avoidMenus: string[] = [];
  for (const m of raw.avoidMenus) {
    const s = strictId(m, LIMITS.menuId);
    if (!s) return null;
    if (!avoidMenus.includes(s)) avoidMenus.push(s);
  }

  const profile: ShareProfile = {
    id,
    diningMode,
    budget,
    fullness,
    preferredCategories,
    preferredFlavors,
    avoidIngredients,
    avoidMenus,
  };
  if (name) profile.name = name;
  return profile;
}

function parseIso(v: unknown): string | null {
  if (!isStr(v) || v.length > 40) return null;
  return Number.isNaN(Date.parse(v)) ? null : v;
}

function parseGroupLabel(v: unknown): { ok: true; value?: string } | { ok: false } {
  if (v === undefined || v === null) return { ok: true };
  if (!isStr(v) || Array.from(v).length > LIMITS.groupLabel) return { ok: false };
  const c = cleanText(v, LIMITS.groupLabel);
  return { ok: true, value: c || undefined };
}

const int = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;

export function parseFinalReceipt(raw: unknown): FinalReceipt | null {
  if (!isObj(raw) || raw.receiptType !== 'final') return null;
  const id = strictId(raw.id, LIMITS.id);
  const createdAt = parseIso(raw.createdAt);
  const group = parseGroupLabel(raw.groupLabel);
  if (!id || !createdAt || !group.ok) return null;
  if (raw.mode !== 'solo' && raw.mode !== 'share') return null;
  if (!Array.isArray(raw.sourceSheetIds) || raw.sourceSheetIds.length > LIMITS.sourceSheetIds) return null;
  const sourceSheetIds: string[] = [];
  for (const s of raw.sourceSheetIds) {
    const sid = strictId(s, LIMITS.id);
    if (!sid) return null;
    sourceSheetIds.push(sid);
  }
  const participantCount = int(raw.participantCount, 1, LIMITS.sourceSheetIds);
  const round = int(raw.round, 1, LIMITS.maxRound);
  const score = int(raw.score, 0, 100);
  if (participantCount === null || round === null || score === null) return null;
  const selectedMenuId = strictId(raw.selectedMenuId, LIMITS.menuId);
  if (!selectedMenuId) return null;
  if (!isStr(raw.selectedMenuName) || Array.from(raw.selectedMenuName).length > LIMITS.menuName) return null;
  const selectedMenuName = cleanText(raw.selectedMenuName, LIMITS.menuName);
  if (!selectedMenuName) return null;
  if (!isStr(raw.selectedCategory) || !(CATEGORIES as readonly string[]).includes(raw.selectedCategory)) return null;
  const rejectedReasonCodes = strictEnumArray<RejectionCode>(
    raw.rejectedReasonCodes,
    REJECTION_CODES,
    REJECTION_CODES.length,
  );
  if (!rejectedReasonCodes) return null;
  const catalogVersion = strictId(raw.catalogVersion, 32);
  if (!catalogVersion) return null;

  const r: FinalReceipt = {
    id,
    createdAt,
    receiptType: 'final',
    mode: raw.mode,
    sourceSheetIds,
    participantCount,
    round,
    selectedMenuId,
    selectedMenuName,
    selectedCategory: raw.selectedCategory as Category,
    score,
    rejectedReasonCodes,
    catalogVersion,
  };
  if (group.value) r.groupLabel = group.value;
  return r;
}

export function parseProfileReceipt(raw: unknown): ProfileReceipt | null {
  if (!isObj(raw) || raw.receiptType !== 'profile' || raw.mode !== 'share') return null;
  const id = strictId(raw.id, LIMITS.id);
  const createdAt = parseIso(raw.createdAt);
  const group = parseGroupLabel(raw.groupLabel);
  const profile = parseShareProfile(raw.profile);
  if (!id || !createdAt || !group.ok || !profile) return null;
  const r: ProfileReceipt = { id, createdAt, receiptType: 'profile', mode: 'share', profile };
  if (group.value) r.groupLabel = group.value;
  return r;
}

export function parseReceipt(raw: unknown): Receipt | null {
  if (!isObj(raw)) return null;
  if (raw.receiptType === 'final') return parseFinalReceipt(raw);
  if (raw.receiptType === 'profile') return parseProfileReceipt(raw);
  return null;
}
