import type { FinalReceipt, MenuItem, PreferenceSheet, Receipt, RankContext } from '@/types';
import { createId } from '@/lib/id';
import { getMenuById } from '@/data/catalog';

/** id 에서 결정적으로 만든 4자리 영수증 번호 */
export function receiptSerial(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return String((h % 9999) + 1).padStart(4, '0');
}
/** 예: #0042-R2 */
export function receiptNo(id: string, round: number): string {
  return `#${receiptSerial(id)}-R${round}`;
}

export function emptyContext(recentMenuIds: string[] = []): RankContext {
  return { rejections: [], recentMenuIds };
}

export function newSheet(type: PreferenceSheet['type']): PreferenceSheet {
  return {
    id: createId('s'),
    type,
    diningMode: 'any',
    budget: null,
    fullness: null,
    preferredCategories: [],
    preferredFlavors: [],
    avoidIngredients: [],
    avoidMenus: [],
    createdAt: new Date().toISOString(),
  };
}

/** 보관함 final 의 최근 메뉴 id (중복 제거, 최대 5) */
export function recentMenuIdsFrom(receipts: Receipt[]): string[] {
  const out: string[] = [];
  for (const r of receipts) {
    if (r.receiptType === 'final' && !out.includes(r.selectedMenuId)) out.push(r.selectedMenuId);
    if (out.length >= 5) break;
  }
  return out;
}

export function uniqueReasons(ctx: RankContext): FinalReceipt['rejectedReasonCodes'] {
  return [...new Set(ctx.rejections.flatMap((r) => r.reasons))];
}

export function priceText(m: Pick<MenuItem, 'priceMin' | 'priceMax'>): string {
  const f = (n: number) => n.toLocaleString('ko-KR');
  return m.priceMin === m.priceMax ? `${f(m.priceMin)}원` : `${f(m.priceMin)}~${f(m.priceMax)}원`;
}

export function menuPriceById(id: string): string | null {
  const m = getMenuById(id);
  return m ? priceText(m) : null;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
