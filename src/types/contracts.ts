/**
 * T0 모듈 인터페이스 계약 (리더 소유).
 * 각 담당자는 아래 시그니처를 그대로 export 한다. (모듈 경로 = 소유 경로)
 *
 *  recommendation  → src/data/catalog.ts, src/features/recommendation/index.ts
 *  data            → src/lib/codec.ts, src/lib/storage.ts, src/lib/map.ts, src/lib/id.ts,
 *                    src/features/share/index.ts, src/features/archive/index.ts, src/hooks/*
 *  ui              → src/pages/*, src/components/*, src/styles/*
 */
import type {
  ActiveDraft,
  Category,
  FinalReceipt,
  MenuItem,
  PreferenceSheet,
  RankContext,
  RankResult,
  Receipt,
  RejectionCode,
  ShareProfile,
} from './domain';

// ───────── recommendation ─────────
// src/data/catalog.ts
//   export const CATALOG: MenuItem[];            // 목표 150종, 최소 100종
//   export const CATALOG_VERSION: string;        // 예: '2026.11-1' — 메뉴 id 집합이 바뀌면 올린다
//   export function getMenuById(id: string): MenuItem | undefined;
export type GetMenuById = (id: string) => MenuItem | undefined;

// src/features/recommendation/index.ts
/**
 * 개인 추천. 규칙:
 *  1) hard 제외: avoidIngredients 포함 메뉴, avoidMenus, ctx.rejections 의 메뉴, diningMode 불일치(any 제외)
 *  2) soft 가중치: 예산, 포만감, 카테고리, 맛 태그
 *  3) ctx.recentMenuIds 감점, ctx.rejections 의 이유 코드로 재가중치(누적)
 *  4) score 0~100 정수, 내림차순, 동점은 menu.id 오름차순(결정적)
 *  5) 후보 0개 → { ok:false, relax } 로 완화할 조건 제안
 */
export type RankMenus = (
  sheet: PreferenceSheet | ShareProfile,
  ctx: RankContext,
  catalog?: MenuItem[],
) => RankResult;

/**
 * 공동 추천. 규칙:
 *  - hard 제외 = 모든 사람의 avoidIngredients/avoidMenus 합집합 + ctx.rejections
 *  - diningMode: 'any' 가 아닌 사람들의 모드 교집합(비면 제한 없음)
 *  - 메뉴별 그룹 점수 = 평균 70% + 최저점 30% (반올림 정수)
 *  - 입력 순서와 무관한 동일 결과, 동점은 menu.id 오름차순
 *  - reasons 에 개인별 점수/이름/개인 이유를 넣지 않는다(예: '모두의 예산 안', '3명 중 다수가 선호한 한식')
 */
export type RankGroup = (
  profiles: ShareProfile[],
  ctx: RankContext,
  catalog?: MenuItem[],
) => RankResult;

/** 거절 누적(순수 함수, 새 객체 반환). 같은 메뉴 재거절 시 이유를 합친다. */
export type ApplyRejection = (
  ctx: RankContext,
  menuId: string,
  reasons: RejectionCode[],
) => RankContext;

// ───────── data: codec ─────────
// src/lib/codec.ts
export type SharePayload =
  | { kind: 'profile'; profile: ShareProfile; groupLabel?: string }
  | { kind: 'final'; receipt: FinalReceipt };

export type DecodeErrorCode =
  | 'empty'
  | 'not_mealipt' // 밥수증 링크 형식이 아님
  | 'too_long' // 링크 길이 제한 초과
  | 'corrupted' // 압축 해제/JSON 실패
  | 'too_large' // 압축 해제 크기 제한 초과
  | 'invalid_schema'
  | 'unsupported_version' // 스키마 버전 불일치
  | 'catalog_mismatch'; // 메뉴 카탈로그 버전 불일치(final 링크에서만 치명적)

export type DecodeResult =
  | { ok: true; payload: SharePayload; schemaVersion: number; catalogVersion: string }
  | { ok: false; error: DecodeErrorCode; message: string }; // message = 사용자용 한국어

/**
 * 링크 형식: `${origin}${pathname}#/open?r=<lz-string base64url>`
 * envelope: { k: 'p'|'f', v: SCHEMA_VERSION, c: CATALOG_VERSION, d: <payload> }
 */
export type EncodeSharePayload = (payload: SharePayload) => string; // r 값만
export type BuildShareUrl = (payload: SharePayload) => string; // 현재 location 기준 전체 URL
export type DecodeShareInput = (input: string) => DecodeResult; // 전체 URL, '#/open?r=..', 또는 r 값 허용

// ───────── data: storage (LocalStorage) ─────────
// src/lib/storage.ts — 키: mealipt.receipts / mealipt.activeDraft / mealipt.groups / mealipt.settings
export type StorageErrorCode = 'unavailable' | 'quota' | 'duplicate' | 'not_found' | 'invalid';
export type StorageResult = { ok: true } | { ok: false; error: StorageErrorCode; message: string };

export interface StorageApi {
  isStorageAvailable(): boolean;
  saveReceipt(r: Receipt): StorageResult; // 같은 id → duplicate
  listReceipts(): Receipt[]; // createdAt 내림차순, 손상 항목은 건너뜀
  getReceipt(id: string): Receipt | undefined;
  deleteReceipt(id: string): StorageResult;
  clearAllData(): StorageResult; // mealipt.* 전체 삭제
  loadDraft(): ActiveDraft | null;
  saveDraft(d: ActiveDraft): StorageResult;
  clearDraft(): void;
  listGroups(): string[];
  saveGroup(label: string): StorageResult; // 중복 무시(ok)
}

// src/lib/map.ts — 지역 + 메뉴를 encodeURIComponent 처리한 검색 링크만 생성
export interface MapLink {
  provider: 'naver' | 'kakao';
  label: string;
  url: string;
}
export type BuildMapLinks = (menuName: string, area?: string) => MapLink[];

// src/lib/id.ts
export type CreateId = (prefix?: string) => string; // crypto.randomUUID 기반, 짧은 형식 허용

// ───────── data: share / archive ─────────
// src/features/share/index.ts
export type ToShareProfile = (sheet: PreferenceSheet) => ShareProfile;
export const MIN_MERGE = 2;
export const MAX_MERGE = 10;
export type AddProfileResult =
  | { ok: true; profiles: ShareProfile[] }
  | { ok: false; error: 'duplicate' | 'limit'; message: string };
export type AddProfile = (list: ShareProfile[], p: ShareProfile) => AddProfileResult;

// src/features/archive/index.ts
export interface GroupStats {
  label: string;
  finalCount: number;
  recentMenus: string[]; // 최근 메뉴명 최대 3
  topCategory: Category | null;
}

export interface Stats {
  total: number; // 전체 밥수증 수(profile + final)
  finalCount: number;
  profileCount: number;
  soloCount: number; // final 중 solo
  shareCount: number; // final 중 share
  soloRatio: number; // 0~1, final 이 0이면 0
  avgRounds: number; // final 평균 추천 시도 횟수(소수 1자리)
  recentMenus: { menuId: string; name: string; createdAt: string }[]; // 최대 5
  topCategories: { category: Category; count: number }[]; // 내림차순 최대 3
  byGroup: GroupStats[]; // 라벨 있는 final 기준, finalCount 내림차순
}
export type ComputeStats = (receipts: Receipt[]) => Stats;

// src/hooks/
//   useReceipts(): { receipts, save(r), remove(id), clearAll(), stats, error }
//   useDraft(flow): { draft, setDraft(d), clear() }  — 변경 시 자동 저장
