import type { ActiveDraft, DraftFlow, Receipt, StorageApi, StorageErrorCode, StorageResult } from '@/types';
import { cleanText, LIMITS, parseReceipt, parseShareProfile } from './validate';

export const KEYS = {
  receipts: 'mealipt.receipts',
  activeDraft: 'mealipt.activeDraft',
  groups: 'mealipt.groups',
  settings: 'mealipt.settings',
} as const;
const PREFIX = 'mealipt.';
const MAX_GROUPS = 30;

const MESSAGES: Record<StorageErrorCode, string> = {
  unavailable: '이 브라우저에서는 저장소를 쓸 수 없어요(사생활 보호 모드 등). 보관함 저장 없이 이용할 수 있어요.',
  quota: '저장 공간이 가득 찼어요. 오래된 밥수증을 삭제한 뒤 다시 시도해 주세요.',
  duplicate: '이미 보관함에 있는 밥수증이에요.',
  not_found: '해당 밥수증을 찾을 수 없어요.',
  invalid: '밥수증 내용이 올바르지 않아 저장하지 못했어요.',
};
const err = (error: StorageErrorCode): StorageResult => ({ ok: false, error, message: MESSAGES[error] });
const OK: StorageResult = { ok: true };

function getStore(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isQuotaError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const x = e as { name?: string; code?: number };
  return x.name === 'QuotaExceededError' || x.name === 'NS_ERROR_DOM_QUOTA_REACHED' || x.code === 22 || x.code === 1014;
}

function readRaw(key: string): string | null {
  try {
    return getStore()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): StorageResult {
  const s = getStore();
  if (!s) return err('unavailable');
  try {
    s.setItem(key, value);
    return OK;
  } catch (e) {
    return err(isQuotaError(e) ? 'quota' : 'unavailable');
  }
}

function readJson(key: string): unknown {
  const raw = readRaw(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function isStorageAvailable(): boolean {
  const s = getStore();
  if (!s) return false;
  try {
    const k = `${PREFIX}__probe`;
    s.setItem(k, '1');
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readReceipts(): Receipt[] {
  const data = readJson(KEYS.receipts);
  if (!Array.isArray(data)) return [];
  const out: Receipt[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    const r = parseReceipt(item);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

export function listReceipts(): Receipt[] {
  return readReceipts().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getReceipt(id: string): Receipt | undefined {
  return readReceipts().find((r) => r.id === id);
}

export function saveReceipt(r: Receipt): StorageResult {
  if (!getStore()) return err('unavailable');
  const clean = parseReceipt(r);
  if (!clean) return err('invalid');
  const list = readReceipts();
  if (list.some((x) => x.id === clean.id)) return err('duplicate');
  list.push(clean);
  return writeRaw(KEYS.receipts, JSON.stringify(list));
}

export function deleteReceipt(id: string): StorageResult {
  if (!getStore()) return err('unavailable');
  const list = readReceipts();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return err('not_found');
  return writeRaw(KEYS.receipts, JSON.stringify(next));
}

export function clearAllData(): StorageResult {
  memoryDraft = null;
  const s = getStore();
  if (!s) return err('unavailable');
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => s.removeItem(k));
    return OK;
  } catch {
    return err('unavailable');
  }
}

// ───────── draft ─────────
const FLOWS: readonly DraftFlow[] = ['solo', 'share-create', 'share-merge'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 손상된 draft 는 null 로 버려 앱이 죽지 않게 한다. */
function parseDraft(raw: unknown): ActiveDraft | null {
  if (!isObj(raw)) return null;
  if (!FLOWS.includes(raw.flow as DraftFlow)) return null;
  if (raw.step !== 'form' && raw.step !== 'result') return null;
  if (typeof raw.round !== 'number' || !Number.isInteger(raw.round) || raw.round < 1 || raw.round > LIMITS.maxRound) return null;
  if (typeof raw.updatedAt !== 'string') return null;
  const ctx = raw.context;
  if (!isObj(ctx) || !Array.isArray(ctx.rejections) || !Array.isArray(ctx.recentMenuIds)) return null;
  if (raw.sheet !== undefined && !isObj(raw.sheet)) return null;
  let profiles: ActiveDraft['profiles'];
  if (raw.profiles !== undefined) {
    if (!Array.isArray(raw.profiles) || raw.profiles.length > LIMITS.sourceSheetIds) return null;
    profiles = [];
    for (const p of raw.profiles) {
      const pp = parseShareProfile(p);
      if (!pp) return null;
      profiles.push(pp);
    }
  }
  const draft = { ...(raw as unknown as ActiveDraft) };
  if (profiles) draft.profiles = profiles;
  if (typeof raw.groupLabel === 'string') draft.groupLabel = cleanText(raw.groupLabel, LIMITS.groupLabel) || undefined;
  return draft;
}

/**
 * 저장소를 쓸 수 없을 때(사생활 보호 모드, quota 등) 화면 흐름이 끊기지 않도록
 * 쓰기에 실패한 draft 만 모듈 메모리에 보관한다(새로고침하면 사라짐).
 */
let memoryDraft: ActiveDraft | null = null;

export function loadDraft(): ActiveDraft | null {
  return memoryDraft ?? parseDraft(readJson(KEYS.activeDraft)); // 메모리는 쓰기 실패 시에만 채워지므로 더 최신
}

/** 실패해도 메모리에는 보관한다. 반환값은 저장 안내용으로 그대로 쓴다. */
export function saveDraft(d: ActiveDraft): StorageResult {
  const res = writeRaw(KEYS.activeDraft, JSON.stringify(d));
  memoryDraft = res.ok ? null : d;
  return res;
}

export function clearDraft(): void {
  memoryDraft = null;
  try {
    getStore()?.removeItem(KEYS.activeDraft);
  } catch {
    /* ignore */
  }
}

// ───────── groups ─────────
export function listGroups(): string[] {
  const data = readJson(KEYS.groups);
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const g of data) {
    const c = cleanText(g, LIMITS.groupLabel);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

export function saveGroup(label: string): StorageResult {
  const c = cleanText(label, LIMITS.groupLabel);
  if (!c) return OK;
  if (!getStore()) return err('unavailable');
  const list = listGroups();
  if (list.includes(c)) return OK;
  list.push(c);
  return writeRaw(KEYS.groups, JSON.stringify(list.slice(-MAX_GROUPS)));
}

export const storage: StorageApi = {
  isStorageAvailable,
  saveReceipt,
  listReceipts,
  getReceipt,
  deleteReceipt,
  clearAllData,
  loadDraft,
  saveDraft,
  clearDraft,
  listGroups,
  saveGroup,
};
