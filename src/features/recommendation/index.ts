// 소유: recommendation (T1). 순수 함수만 둔다(랜덤/시간/전역 상태 없음).
import { CATALOG, getMenuById } from '@/data/catalog';
import {
  CATEGORY_LABEL,
  FLAVOR_LABEL,
  type ApplyRejection,
  type DiningMode,
  type DiningModeSpecific,
  type Flavor,
  type Ingredient,
  type Level3,
  type MenuItem,
  type RankContext,
  type RankGroup,
  type RankMenus,
  type RankResult,
  type RejectionCode,
  type RelaxKey,
  type RelaxSuggestion,
  type ScoredMenu,
  type ShareProfile,
} from '@/types';

/** 추천에 필요한 취향 필드만 (PreferenceSheet / ShareProfile 공통) */
export type Prefs = Pick<
  ShareProfile,
  | 'diningMode'
  | 'budget'
  | 'fullness'
  | 'preferredCategories'
  | 'preferredFlavors'
  | 'avoidIngredients'
  | 'avoidMenus'
>;

// ───────── 점수 상수 (기준점 40 + 가감, 0~100 clamp) ─────────
export const BASE_SCORE = 40;
const W = {
  budgetInside: 14, // priceMax <= 예산
  budgetPartial: 6, // 가격 범위가 예산에 걸침
  budgetOver: -30, // priceMin > 예산
  fullness: [12, 2, -10] as const, // 차이 0 / 1 / 2
  category: 14,
  flavorEach: 7, // 겹치는 맛 1개당(최대 2개)
  flavorNone: -3, // 선호 맛이 있는데 하나도 안 겹침
  spicyFit: 4,
  spicyMiss: -4,
  mildVsHot: -6,
  richFit: 3,
  freshVsGreasy: -3,
  recent: -12,
} as const;
const REJ = {
  too_spicy: -12,
  too_heavy: -10,
  too_heavyGreasy: -5,
  too_greasy: -12,
  too_expensive: -12,
  different_category: -15,
  ate_recently: -5,
} as const;

interface RejectedMenu {
  menu: MenuItem;
  reasons: RejectionCode[];
}

export function formatWon(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function resolveRejected(ctx: RankContext, catalog: MenuItem[]): RejectedMenu[] {
  const byId = new Map(catalog.map((m) => [m.id, m]));
  const out: RejectedMenu[] = [];
  for (const r of ctx.rejections) {
    const menu = byId.get(r.menuId) ?? getMenuById(r.menuId);
    if (menu) out.push({ menu, reasons: r.reasons });
  }
  return out;
}

/** 거절 이유 누적에 따른 감점(0 이하). 거절 한 번마다 중첩된다. */
function rejectionPenalty(menu: MenuItem, rejected: RejectedMenu[]): number {
  let p = 0;
  for (const { menu: r, reasons } of rejected) {
    for (const code of new Set(reasons)) {
      switch (code) {
        case 'too_spicy':
          if (menu.spicy >= Math.max(1, r.spicy)) p += REJ.too_spicy;
          break;
        case 'too_heavy':
          if (menu.fullness >= Math.max(2, r.fullness)) p += REJ.too_heavy;
          if (menu.greasy >= Math.max(2, r.greasy)) p += REJ.too_heavyGreasy;
          break;
        case 'too_greasy':
          if (menu.greasy >= Math.max(1, r.greasy)) p += REJ.too_greasy;
          break;
        case 'too_expensive':
          if (menu.priceMin >= r.priceMin) p += REJ.too_expensive;
          break;
        case 'different_category':
          if (menu.category === r.category) p += REJ.different_category;
          break;
        case 'ate_recently':
          if (menu.category === r.category) p += REJ.ate_recently;
          break;
        case 'not_feeling_it':
          break; // 해당 메뉴 제외만 (hard 단계에서 처리)
      }
    }
  }
  return p;
}

interface ReasonCandidate {
  text: string;
  weight: number;
}

function hasFlavor(menu: MenuItem, f: Flavor): boolean {
  return menu.tags.includes(f) || (f === 'soupy' && menu.soup);
}

/** 개인 soft 점수와 이유 후보. hard 제외는 여기서 다루지 않는다. */
export function scoreMenu(
  prefs: Prefs,
  menu: MenuItem,
  ctx: RankContext,
  catalog: MenuItem[] = CATALOG,
): ScoredMenu {
  return scoreWith(prefs, menu, ctx, resolveRejected(ctx, catalog));
}

function scoreWith(
  prefs: Prefs,
  menu: MenuItem,
  ctx: RankContext,
  rejected: RejectedMenu[],
): ScoredMenu {
  let s = BASE_SCORE;
  const cands: ReasonCandidate[] = [];

  // 예산
  if (prefs.budget !== null) {
    if (menu.priceMax <= prefs.budget) {
      s += W.budgetInside;
      cands.push({ text: `예산 ${formatWon(prefs.budget)}원 안`, weight: 6 });
    } else if (menu.priceMin <= prefs.budget) {
      s += W.budgetPartial;
    } else {
      s += W.budgetOver;
    }
  }

  // 포만감
  if (prefs.fullness !== null) {
    const diff = Math.abs(menu.fullness - prefs.fullness);
    s += W.fullness[Math.min(diff, 2)];
    if (diff === 0) {
      const text =
        menu.fullness === 3
          ? '든든하게 먹기 좋아요'
          : menu.fullness === 2
            ? '적당한 양이에요'
            : '가볍게 먹기 좋아요';
      cands.push({ text, weight: 4 });
    }
  }

  // 카테고리 + 맛
  const catHit = prefs.preferredCategories.includes(menu.category);
  if (catHit) s += W.category;
  const hits = prefs.preferredFlavors.filter((f) => hasFlavor(menu, f));
  s += Math.min(hits.length, 2) * W.flavorEach;
  if (prefs.preferredFlavors.length > 0 && hits.length === 0) s += W.flavorNone;

  const catLabel = CATEGORY_LABEL[menu.category];
  if (hits.length > 0 && catHit) {
    cands.push({ text: `${FLAVOR_LABEL[hits[0]]} ${catLabel}`, weight: 10 });
  } else if (hits.length > 0) {
    cands.push({ text: `${FLAVOR_LABEL[hits[0]]} 메뉴`, weight: 8 });
  } else if (catHit) {
    cands.push({ text: `선호하는 ${catLabel}`, weight: 9 });
  }

  // 매운맛/기름짐: 선호 맛과의 연관
  const likesSpicy = prefs.preferredFlavors.includes('spicy');
  const likesMild = prefs.preferredFlavors.includes('mild');
  if (likesSpicy) s += menu.spicy >= 2 ? W.spicyFit : menu.spicy === 0 ? W.spicyMiss : 0;
  if (likesMild && !likesSpicy && menu.spicy >= 2) s += W.mildVsHot;
  if (prefs.preferredFlavors.includes('rich') && menu.greasy >= 2) s += W.richFit;
  if (prefs.preferredFlavors.includes('fresh') && menu.greasy >= 2) s += W.freshVsGreasy;

  // 최근 먹은 메뉴
  if (ctx.recentMenuIds.includes(menu.id)) s += W.recent;

  // 거절 누적
  s += rejectionPenalty(menu, rejected);

  const reasons = cands
    .sort((a, b) => b.weight - a.weight || (a.text < b.text ? -1 : 1))
    .slice(0, 3)
    .map((c) => c.text);
  if (reasons.length === 0) reasons.push(defaultReason(menu));

  return { menu, score: clampScore(s), reasons };
}

function defaultReason(menu: MenuItem): string {
  if (menu.soup) return `속 편한 국물 ${CATEGORY_LABEL[menu.category]}`;
  return `무난하게 먹기 좋은 ${CATEGORY_LABEL[menu.category]}`;
}

// ───────── hard 제외 ─────────

interface HardFilter {
  avoidIngredients: ReadonlySet<Ingredient>;
  avoidMenus: ReadonlySet<string>;
  rejectedIds: ReadonlySet<string>;
  /** null = 제한 없음 */
  modes: DiningModeSpecific[] | null;
}

function passesHard(menu: MenuItem, f: HardFilter): boolean {
  if (f.avoidMenus.has(menu.id) || f.rejectedIds.has(menu.id)) return false;
  if (menu.ingredients.some((i) => f.avoidIngredients.has(i))) return false;
  if (f.modes && !f.modes.every((m) => menu.modes.includes(m))) return false;
  return true;
}

function modesOf(list: DiningMode[]): DiningModeSpecific[] | null {
  const specific = [...new Set(list.filter((m): m is DiningModeSpecific => m !== 'any'))];
  // 서로 다른 방식을 고른 사람들이 섞이면 교집합이 비므로 제한 없음
  return specific.length === 1 ? specific : null;
}

interface FilterOpts {
  mode: boolean;
  rej: boolean;
  ing?: boolean;
  menus?: boolean;
}

function buildFilter(list: Prefs[], ctx: RankContext, opts: FilterOpts): HardFilter {
  const modes = opts.mode ? modesOf(list.map((p) => p.diningMode)) : null;
  return {
    avoidIngredients: new Set(opts.ing === false ? [] : list.flatMap((p) => p.avoidIngredients)),
    avoidMenus: new Set(opts.menus === false ? [] : list.flatMap((p) => p.avoidMenus)),
    rejectedIds: new Set(opts.rej ? ctx.rejections.map((r) => r.menuId) : []),
    modes,
  };
}

/**
 * 후보가 0일 때 실제로 걸린 hard 조건에서 완화 제안을 만든다(개인 정보 없는 문구).
 * 한 조건만 풀어서 후보가 생기면 그 조건들을, 아니면 걸려 있는 조건 전부를 제안한다.
 * 예산/포만감/카테고리/맛은 soft 점수라 후보를 0으로 만들지 않으므로 제안하지 않는다.
 */
function relaxFor(list: Prefs[], ctx: RankContext, catalog: MenuItem[]): RelaxSuggestion[] {
  const all = { mode: true, rej: true, ing: true, menus: true };
  const conds: { key: RelaxKey; active: boolean; off: Partial<FilterOpts>; label: string }[] = [
    {
      key: 'diningMode',
      active: modesOf(list.map((p) => p.diningMode)) !== null,
      off: { mode: false },
      label: list.length > 1 ? '식사 방식 조건을 풀어보세요' : '식사 방식을 상관없음으로 바꿔보세요',
    },
    { key: 'rejections', active: ctx.rejections.length > 0, off: { rej: false }, label: '거절한 메뉴 기록을 초기화해 보세요' },
    {
      key: 'avoidIngredients',
      active: list.some((p) => p.avoidIngredients.length > 0),
      off: { ing: false },
      label: '제외 재료를 조금 줄여보세요',
    },
    {
      key: 'avoidMenus',
      active: list.some((p) => p.avoidMenus.length > 0),
      off: { menus: false },
      label: '제외한 메뉴를 다시 열어보세요',
    },
  ];
  const active = conds.filter((c) => c.active);
  const solo = active.filter((c) => {
    const f = buildFilter(list, ctx, { ...all, ...c.off });
    return catalog.some((m) => passesHard(m, f));
  });
  return (solo.length > 0 ? solo : active).map(({ key, label }) => ({ key, label }));
}

function sortScored(items: ScoredMenu[]): ScoredMenu[] {
  return items.sort((a, b) => b.score - a.score || (a.menu.id < b.menu.id ? -1 : a.menu.id > b.menu.id ? 1 : 0));
}

// ───────── 개인 추천 ─────────

export const rankMenus: RankMenus = (sheet, ctx, catalog = CATALOG): RankResult => {
  const filter = buildFilter([sheet], ctx, { mode: true, rej: true });
  const rejected = resolveRejected(ctx, catalog);
  const items = catalog
    .filter((m) => passesHard(m, filter))
    .map((m) => scoreWith(sheet, m, ctx, rejected));
  if (items.length === 0) {
    return { ok: false, reason: 'no_candidates', relax: relaxFor([sheet], ctx, catalog) };
  }
  return { ok: true, items: sortScored(items) };
};

// ───────── 공동 추천 ─────────

const GROUP_AVG = 0.7;
const GROUP_MIN = 0.3;

/** 그룹 점수 공식: 평균 70% + 최저점 30% (반올림). 개인 점수는 정수이므로 순서 무관. */
export function combineGroupScore(personal: number[]): number {
  if (personal.length === 0) return 0;
  const sum = personal.reduce((a, b) => a + b, 0);
  const avg = sum / personal.length;
  const min = Math.min(...personal);
  return clampScore(GROUP_AVG * avg + GROUP_MIN * min);
}

function groupReasons(profiles: ShareProfile[], menu: MenuItem): string[] {
  const n = profiles.length;
  const cands: ReasonCandidate[] = [];

  const budgets = profiles.map((p) => p.budget).filter((b): b is number => b !== null);
  if (budgets.length > 0 && budgets.every((b) => menu.priceMax <= b)) {
    cands.push({ text: n > 1 ? '모두의 예산 안' : `예산 ${formatWon(budgets[0])}원 안`, weight: 8 });
  }

  const catCount = profiles.filter((p) => p.preferredCategories.includes(menu.category)).length;
  const catLabel = CATEGORY_LABEL[menu.category];
  if (n > 1 && catCount === n) cands.push({ text: `모두가 고른 ${catLabel}`, weight: 10 });
  else if (catCount >= 2) cands.push({ text: `여러 명이 고른 ${catLabel}`, weight: 9 });
  else if (n === 1 && catCount === 1) cands.push({ text: `선호하는 ${catLabel}`, weight: 9 });

  // 가장 많은 사람이 고른 맛(동수면 FLAVOR 코드 순)
  const flavorCount = new Map<Flavor, number>();
  for (const p of profiles) {
    for (const f of new Set(p.preferredFlavors)) {
      if (hasFlavor(menu, f)) flavorCount.set(f, (flavorCount.get(f) ?? 0) + 1);
    }
  }
  const topFlavor = [...flavorCount.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  if (topFlavor && (n === 1 || topFlavor[1] >= 2)) {
    cands.push({ text: `${n === 1 ? '' : '여러 명이 좋아하는 '}${FLAVOR_LABEL[topFlavor[0]]} 메뉴`, weight: 7 });
  }

  const fullnessMatch = profiles.filter((p) => p.fullness === menu.fullness).length;
  if (fullnessMatch >= Math.min(2, n) && fullnessMatch > 0) {
    const l = menu.fullness as Level3;
    cands.push({
      text: l === 3 ? '든든하게 먹기 좋아요' : l === 2 ? '적당한 양이에요' : '가볍게 먹기 좋아요',
      weight: 4,
    });
  }

  const reasons = cands
    .sort((a, b) => b.weight - a.weight || (a.text < b.text ? -1 : 1))
    .slice(0, 3)
    .map((c) => c.text);
  if (reasons.length === 0) reasons.push('모두의 제외 조건을 피한 무난한 메뉴');
  return reasons;
}

export const rankGroup: RankGroup = (profiles, ctx, catalog = CATALOG): RankResult => {
  if (profiles.length === 0) {
    return { ok: false, reason: 'no_candidates', relax: [] };
  }
  const filter = buildFilter(profiles, ctx, { mode: true, rej: true });
  const rejected = resolveRejected(ctx, catalog);
  const items: ScoredMenu[] = catalog
    .filter((m) => passesHard(m, filter))
    .map((menu) => {
      const personal = profiles.map((p) => scoreWith(p, menu, ctx, rejected).score);
      return { menu, score: combineGroupScore(personal), reasons: groupReasons(profiles, menu) };
    });
  if (items.length === 0) {
    return { ok: false, reason: 'no_candidates', relax: relaxFor(profiles, ctx, catalog) };
  }
  return { ok: true, items: sortScored(items) };
};

// ───────── 거절 누적 ─────────

export const applyRejection: ApplyRejection = (ctx, menuId, reasons) => {
  const existing = ctx.rejections.find((r) => r.menuId === menuId);
  const merged = (prev: RejectionCode[]) => [...new Set([...prev, ...reasons])];
  const rejections = existing
    ? ctx.rejections.map((r) => (r.menuId === menuId ? { menuId, reasons: merged(r.reasons) } : { ...r, reasons: [...r.reasons] }))
    : [...ctx.rejections.map((r) => ({ ...r, reasons: [...r.reasons] })), { menuId, reasons: merged([]) }];
  return { ...ctx, rejections, recentMenuIds: [...ctx.recentMenuIds] };
};
