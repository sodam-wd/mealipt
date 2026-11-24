/**
 * T0 공통 도메인 타입 (리더 소유). 변경은 리더만 수행하고 팀 전체에 공지한다.
 */

export const CATEGORIES = [
  'korean',
  'chinese',
  'japanese',
  'western',
  'snack',
  'asian',
  'fastfood',
  'light',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** 맛/식감 태그. MenuItem.tags 와 PreferenceSheet.preferredFlavors 가 공유한다. */
export const FLAVORS = [
  'spicy', // 매콤
  'mild', // 순한
  'savory', // 감칠맛/짭짤
  'sweet', // 달콤
  'tangy', // 새콤
  'rich', // 진한/고소
  'fresh', // 산뜻
  'soupy', // 국물
  'crispy', // 바삭
  'chewy', // 쫄깃
] as const;
export type Flavor = (typeof FLAVORS)[number];

/** 제외 재료 코드. MenuItem.ingredients 는 이 코드만 사용한다. */
export const INGREDIENTS = [
  'pork',
  'beef',
  'chicken',
  'lamb',
  'fish',
  'raw_fish',
  'shellfish', // 새우/게/조개 등 갑각류·패류
  'egg',
  'dairy',
  'wheat',
  'nuts',
  'soy',
  'organ', // 내장/곱창
  'cilantro',
  'mushroom',
] as const;
export type Ingredient = (typeof INGREDIENTS)[number];

export const DINING_MODES = ['eatout', 'delivery', 'home'] as const;
export type DiningModeSpecific = (typeof DINING_MODES)[number];
export type DiningMode = DiningModeSpecific | 'any';

export type Level3 = 1 | 2 | 3;
export type Level0to3 = 0 | 1 | 2 | 3;

export interface MenuItem {
  id: string; // 안정적인 kebab-case, 예: 'kimchi-jjigae'. 정렬 동점 처리 기준.
  name: string; // 한국어 메뉴명
  category: Category;
  priceMin: number; // 원
  priceMax: number; // 원
  fullness: Level3; // 1 가벼움 ~ 3 든든
  spicy: Level0to3;
  greasy: Level0to3;
  soup: boolean;
  tags: Flavor[];
  ingredients: Ingredient[];
  modes: DiningModeSpecific[]; // 먹을 수 있는 방식
}

export const REJECTION_CODES = [
  'too_spicy',
  'too_heavy',
  'too_greasy',
  'too_expensive',
  'ate_recently',
  'not_feeling_it',
  'different_category',
] as const;
export type RejectionCode = (typeof REJECTION_CODES)[number];

/** 사용자가 주문서로 입력하는 원본 취향. 로컬에서만 원본 그대로 다룬다. */
export interface PreferenceSheet {
  id: string;
  type: 'solo' | 'share-profile';
  name?: string; // 함께 먹기용 닉네임(선택, 최대 12자)
  diningMode: DiningMode;
  budget: number | null; // 1인 최대 예산(원). null = 상관없음
  fullness: Level3 | null; // null = 상관없음
  preferredCategories: Category[];
  preferredFlavors: Flavor[];
  avoidIngredients: Ingredient[]; // 필수 제외(hard)
  avoidMenus: string[]; // 필수 제외 메뉴 id(hard)
  createdAt: string; // ISO
}

/**
 * 공유 링크에 담는 최소 취향 프로필.
 * 원본 sheet 에서 id/type/createdAt 을 빼고 추천에 필요한 값만 남긴다.
 * 링크를 가진 사람은 이 내용을 디코드해 볼 수 있음을 UI에서 고지한다.
 */
export interface ShareProfile {
  id: string; // 프로필 고유 ID (중복 합치기 차단 기준)
  name?: string;
  diningMode: DiningMode;
  budget: number | null;
  fullness: Level3 | null;
  preferredCategories: Category[];
  preferredFlavors: Flavor[];
  avoidIngredients: Ingredient[];
  avoidMenus: string[];
}

/** 재추천 컨텍스트 (순수 데이터, 누적) */
export interface RejectionRecord {
  menuId: string;
  reasons: RejectionCode[];
}

export interface RankContext {
  rejections: RejectionRecord[]; // 누적 거절 기록. 거절된 메뉴는 다시 추천하지 않는다.
  recentMenuIds: string[]; // 보관함 최근 최종 메뉴(감점용)
}

export interface ScoredMenu {
  menu: MenuItem;
  score: number; // 0~100 정수, 일치 점수
  reasons: string[]; // 사람에게 보여줄 추천 이유(한국어, 1~3개). 그룹 결과에는 개인 정보 금지.
}

export type RelaxKey =
  | 'budget'
  | 'fullness'
  | 'categories'
  | 'flavors'
  | 'diningMode'
  | 'rejections'
  | 'avoidIngredients'
  | 'avoidMenus';

export interface RelaxSuggestion {
  key: RelaxKey;
  label: string; // 예: '예산 조건을 풀어보세요'
}

export type RankResult =
  | { ok: true; items: ScoredMenu[] } // 점수 내림차순, 동점은 menu.id 오름차순
  | { ok: false; reason: 'no_candidates'; relax: RelaxSuggestion[] };

// ───────── Receipts (discriminated union) ─────────

interface ReceiptBase {
  id: string;
  createdAt: string; // ISO
  groupLabel?: string; // 모임 라벨(예: '대학친구'), 최대 16자
}

/** 함께 먹기용 개인 취향 밥수증. 메뉴를 요구하지 않는다. */
export interface ProfileReceipt extends ReceiptBase {
  receiptType: 'profile';
  mode: 'share';
  profile: ShareProfile;
}

/** 최종 밥수증 (혼자 / 함께 공통) */
export interface FinalReceipt extends ReceiptBase {
  receiptType: 'final';
  mode: 'solo' | 'share';
  sourceSheetIds: string[]; // solo: [sheet.id], share: 합친 프로필 id 목록(정렬)
  participantCount: number; // solo: 1
  round: number; // 몇 번째 추천에서 결정했는지 (1부터)
  selectedMenuId: string;
  selectedMenuName: string; // 카탈로그 변경 대비 스냅샷
  selectedCategory: Category;
  score: number; // 결정 당시 일치 점수
  rejectedReasonCodes: RejectionCode[]; // 누적 거절 이유(중복 제거)
  catalogVersion: string;
}

export type Receipt = ProfileReceipt | FinalReceipt;

// ───────── 진행 상태 (이어하기) ─────────

export type DraftFlow = 'solo' | 'share-create' | 'share-merge';

export interface ActiveDraft {
  flow: DraftFlow;
  step: 'form' | 'result';
  sheet?: PreferenceSheet; // solo / share-create 입력 중인 주문서
  profiles?: ShareProfile[]; // share-merge 에 추가된 프로필(2~10)
  context: RankContext;
  round: number; // 1부터
  groupLabel?: string;
  updatedAt: string;
}
