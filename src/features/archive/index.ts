import { CATEGORIES, type Category, type ComputeStats, type FinalReceipt, type GroupStats } from '@/types';

const time = (r: { createdAt: string }) => Date.parse(r.createdAt) || 0;

function topCategoryOf(finals: FinalReceipt[]): Category | null {
  const counts = countCategories(finals);
  return counts.length ? counts[0].category : null;
}

/** 내림차순, 동점은 CATEGORIES 순서(결정적). */
function countCategories(finals: FinalReceipt[]): { category: Category; count: number }[] {
  const map = new Map<Category, number>();
  for (const f of finals) map.set(f.selectedCategory, (map.get(f.selectedCategory) ?? 0) + 1);
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category));
}

export const computeStats: ComputeStats = (receipts) => {
  const finals = receipts
    .filter((r): r is FinalReceipt => r.receiptType === 'final')
    .sort((a, b) => time(b) - time(a));
  const profileCount = receipts.length - finals.length;
  const soloCount = finals.filter((f) => f.mode === 'solo').length;
  const shareCount = finals.length - soloCount;
  const avgRounds = finals.length
    ? Math.round((finals.reduce((s, f) => s + f.round, 0) / finals.length) * 10) / 10
    : 0;

  const groups = new Map<string, FinalReceipt[]>();
  for (const f of finals) {
    if (!f.groupLabel) continue;
    const arr = groups.get(f.groupLabel) ?? [];
    arr.push(f);
    groups.set(f.groupLabel, arr);
  }
  const byGroup: GroupStats[] = [...groups.entries()]
    .map(([label, list]) => ({
      label,
      finalCount: list.length,
      recentMenus: list.slice(0, 3).map((f) => f.selectedMenuName),
      topCategory: topCategoryOf(list),
    }))
    .sort((a, b) => b.finalCount - a.finalCount || a.label.localeCompare(b.label, 'ko'));

  return {
    total: receipts.length,
    finalCount: finals.length,
    profileCount,
    soloCount,
    shareCount,
    soloRatio: finals.length ? soloCount / finals.length : 0,
    avgRounds,
    recentMenus: finals.slice(0, 5).map((f) => ({ menuId: f.selectedMenuId, name: f.selectedMenuName, createdAt: f.createdAt })),
    topCategories: countCategories(finals).slice(0, 3),
    byGroup,
  };
};
