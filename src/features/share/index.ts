import {
  CATEGORIES,
  DINING_MODES,
  FLAVORS,
  INGREDIENTS,
  MAX_MERGE,
  MIN_MERGE,
  type AddProfile,
  type DiningMode,
  type ShareProfile,
  type ToShareProfile,
} from '@/types';
import { cleanText, LIMITS, pickEnums } from '@/lib/validate';

export { MAX_MERGE, MIN_MERGE };

/** 원본 주문서에서 추천에 필요한 값만 남기고 정제한다(id/type/createdAt 제외). */
export const toShareProfile: ToShareProfile = (s) => {
  const mode = (['any', ...DINING_MODES] as string[]).includes(s.diningMode) ? s.diningMode : ('any' as DiningMode);
  const budget =
    typeof s.budget === 'number' && Number.isFinite(s.budget) && s.budget >= 0
      ? Math.min(Math.round(s.budget), LIMITS.maxBudget)
      : null;
  const avoidMenus: string[] = [];
  for (const m of Array.isArray(s.avoidMenus) ? s.avoidMenus : []) {
    const c = cleanText(m, LIMITS.menuId);
    if (c && !avoidMenus.includes(c) && avoidMenus.length < LIMITS.avoidMenus) avoidMenus.push(c);
  }
  const profile: ShareProfile = {
    id: s.id,
    diningMode: mode,
    budget,
    fullness: s.fullness === 1 || s.fullness === 2 || s.fullness === 3 ? s.fullness : null,
    preferredCategories: pickEnums(s.preferredCategories, CATEGORIES),
    preferredFlavors: pickEnums(s.preferredFlavors, FLAVORS),
    avoidIngredients: pickEnums(s.avoidIngredients, INGREDIENTS),
    avoidMenus,
  };
  const name = cleanText(s.name, LIMITS.nickname);
  if (name) profile.name = name;
  return profile;
};

export const addProfile: AddProfile = (list, p) => {
  if (list.some((x) => x.id === p.id)) {
    return { ok: false, error: 'duplicate', message: '이미 합친 취향 밥수증이에요. 같은 링크는 한 번만 추가할 수 있어요.' };
  }
  if (list.length >= MAX_MERGE) {
    return { ok: false, error: 'limit', message: `한 번에 최대 ${MAX_MERGE}장까지 합칠 수 있어요.` };
  }
  return { ok: true, profiles: [...list, p] };
};
