/** T0 샘플 fixture (리더 소유). 가상 데이터만 사용한다. 테스트/UI 개발용. */
import type {
  FinalReceipt,
  MenuItem,
  PreferenceSheet,
  ProfileReceipt,
  RankResult,
  ShareProfile,
} from './domain';

export const FIXTURE_MENUS: MenuItem[] = [
  { id: 'bibimbap', name: '비빔밥', category: 'korean', priceMin: 9000, priceMax: 12000, fullness: 2, spicy: 1, greasy: 0, soup: false, tags: ['fresh', 'savory'], ingredients: ['egg', 'beef', 'soy'], modes: ['eatout', 'delivery', 'home'] },
  { id: 'kimchi-jjigae', name: '김치찌개', category: 'korean', priceMin: 8000, priceMax: 10000, fullness: 2, spicy: 2, greasy: 1, soup: true, tags: ['spicy', 'soupy', 'savory'], ingredients: ['pork', 'soy'], modes: ['eatout', 'delivery', 'home'] },
  { id: 'jjajangmyeon', name: '짜장면', category: 'chinese', priceMin: 7000, priceMax: 9000, fullness: 3, spicy: 0, greasy: 2, soup: false, tags: ['savory', 'sweet', 'chewy'], ingredients: ['wheat', 'pork', 'soy'], modes: ['eatout', 'delivery'] },
  { id: 'salmon-sushi', name: '연어초밥', category: 'japanese', priceMin: 13000, priceMax: 20000, fullness: 2, spicy: 0, greasy: 1, soup: false, tags: ['fresh', 'rich'], ingredients: ['raw_fish', 'fish'], modes: ['eatout', 'delivery'] },
  { id: 'tomato-pasta', name: '토마토 파스타', category: 'western', priceMin: 13000, priceMax: 17000, fullness: 2, spicy: 0, greasy: 1, soup: false, tags: ['tangy', 'savory'], ingredients: ['wheat', 'dairy'], modes: ['eatout', 'delivery', 'home'] },
  { id: 'tteokbokki', name: '떡볶이', category: 'snack', priceMin: 5000, priceMax: 9000, fullness: 2, spicy: 3, greasy: 1, soup: false, tags: ['spicy', 'sweet', 'chewy'], ingredients: ['wheat', 'fish'], modes: ['eatout', 'delivery', 'home'] },
  { id: 'pho', name: '쌀국수', category: 'asian', priceMin: 10000, priceMax: 13000, fullness: 2, spicy: 0, greasy: 0, soup: true, tags: ['soupy', 'fresh', 'mild'], ingredients: ['beef', 'cilantro'], modes: ['eatout', 'delivery'] },
  { id: 'poke-bowl', name: '포케', category: 'light', priceMin: 11000, priceMax: 15000, fullness: 1, spicy: 0, greasy: 0, soup: false, tags: ['fresh', 'tangy'], ingredients: ['raw_fish', 'soy'], modes: ['eatout', 'delivery'] },
];

export const FIXTURE_SHEET: PreferenceSheet = {
  id: 'sheet-fixture-1',
  type: 'solo',
  diningMode: 'any',
  budget: 12000,
  fullness: 2,
  preferredCategories: ['korean'],
  preferredFlavors: ['soupy'],
  avoidIngredients: ['raw_fish'],
  avoidMenus: [],
  createdAt: '2026-11-24T12:00:00.000Z',
};

export const FIXTURE_PROFILES: ShareProfile[] = [
  { id: 'prof-a', name: '토마토', diningMode: 'eatout', budget: 15000, fullness: 3, preferredCategories: ['korean', 'chinese'], preferredFlavors: ['spicy'], avoidIngredients: [], avoidMenus: [] },
  { id: 'prof-b', name: '올리브', diningMode: 'any', budget: 12000, fullness: 2, preferredCategories: ['japanese'], preferredFlavors: ['fresh'], avoidIngredients: ['pork'], avoidMenus: [] },
  { id: 'prof-c', diningMode: 'any', budget: null, fullness: null, preferredCategories: [], preferredFlavors: ['mild'], avoidIngredients: ['cilantro'], avoidMenus: ['tteokbokki'] },
];

export const FIXTURE_RANK_RESULT: RankResult = {
  ok: true,
  items: [
    { menu: FIXTURE_MENUS[1], score: 92, reasons: ['국물 있는 한식', '예산 12,000원 안'] },
    { menu: FIXTURE_MENUS[0], score: 78, reasons: ['선호 카테고리 한식'] },
    { menu: FIXTURE_MENUS[6], score: 64, reasons: ['국물 있는 메뉴'] },
  ],
};

export const FIXTURE_EMPTY_RESULT: RankResult = {
  ok: false,
  reason: 'no_candidates',
  relax: [
    { key: 'budget', label: '예산 조건을 풀어보세요' },
    { key: 'categories', label: '카테고리를 하나 더 골라보세요' },
  ],
};

export const FIXTURE_FINAL_SOLO: FinalReceipt = {
  id: 'rcpt-solo-1',
  receiptType: 'final',
  mode: 'solo',
  createdAt: '2026-11-24T12:30:00.000Z',
  sourceSheetIds: ['sheet-fixture-1'],
  participantCount: 1,
  round: 2,
  selectedMenuId: 'kimchi-jjigae',
  selectedMenuName: '김치찌개',
  selectedCategory: 'korean',
  score: 92,
  rejectedReasonCodes: ['too_expensive'],
  catalogVersion: 'fixture',
};

export const FIXTURE_FINAL_SHARE: FinalReceipt = {
  id: 'rcpt-share-1',
  receiptType: 'final',
  mode: 'share',
  createdAt: '2026-11-24T19:00:00.000Z',
  groupLabel: '대학친구',
  sourceSheetIds: ['prof-a', 'prof-b', 'prof-c'],
  participantCount: 3,
  round: 1,
  selectedMenuId: 'bibimbap',
  selectedMenuName: '비빔밥',
  selectedCategory: 'korean',
  score: 81,
  rejectedReasonCodes: [],
  catalogVersion: 'fixture',
};

export const FIXTURE_PROFILE_RECEIPT: ProfileReceipt = {
  id: 'rcpt-prof-a',
  receiptType: 'profile',
  mode: 'share',
  createdAt: '2026-11-24T18:00:00.000Z',
  profile: FIXTURE_PROFILES[0],
};
