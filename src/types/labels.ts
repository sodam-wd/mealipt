/** 화면 표시용 한국어 라벨 (리더 소유, 모든 팀 공통 사용) */
import type {
  Category,
  DiningMode,
  Flavor,
  Ingredient,
  Level3,
  RejectionCode,
} from './domain';

export const CATEGORY_LABEL: Record<Category, string> = {
  korean: '한식',
  chinese: '중식',
  japanese: '일식',
  western: '양식',
  snack: '분식',
  asian: '아시안',
  fastfood: '패스트푸드',
  light: '가벼운 식사',
};

export const FLAVOR_LABEL: Record<Flavor, string> = {
  spicy: '매콤한',
  mild: '순한',
  savory: '짭짤·감칠맛',
  sweet: '달콤한',
  tangy: '새콤한',
  rich: '진하고 고소한',
  fresh: '산뜻한',
  soupy: '국물 있는',
  crispy: '바삭한',
  chewy: '쫄깃한',
};

export const INGREDIENT_LABEL: Record<Ingredient, string> = {
  pork: '돼지고기',
  beef: '소고기',
  chicken: '닭고기',
  lamb: '양고기',
  fish: '생선',
  raw_fish: '날생선',
  shellfish: '갑각류·조개',
  egg: '달걀',
  dairy: '유제품',
  wheat: '밀가루',
  nuts: '견과류',
  soy: '콩·대두',
  organ: '내장·곱창',
  cilantro: '고수',
  mushroom: '버섯',
};

export const DINING_MODE_LABEL: Record<DiningMode, string> = {
  eatout: '나가서 먹기',
  delivery: '배달',
  home: '집에서 해먹기',
  any: '상관없음',
};

export const FULLNESS_LABEL: Record<Level3, string> = {
  1: '가볍게',
  2: '적당히',
  3: '든든하게',
};

export const REJECTION_LABEL: Record<RejectionCode, string> = {
  too_spicy: '너무 매워요',
  too_heavy: '너무 무거워요',
  too_greasy: '너무 느끼해요',
  too_expensive: '너무 비싸요',
  ate_recently: '최근에 먹었어요',
  not_feeling_it: '그냥 안 당겨요',
  different_category: '다른 종류가 좋아요',
};

/** 예산 선택지(1인, 원). null = 상관없음 */
export const BUDGET_OPTIONS: (number | null)[] = [8000, 12000, 15000, 20000, 30000, null];
