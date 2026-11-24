// 소유: recommendation (T1). 메뉴 데이터는 menus.json(텍스트/JSON)으로 관리한다. 음식 이미지 매핑 없음.
import type { MenuItem } from '@/types';
import menus from './menus.json';

/** 메뉴 id 집합이 바뀌면 올린다. 공유 링크의 catalogVersion 불일치 판정에 쓰인다. */
export const CATALOG_VERSION = '2026.11-1';

export const CATALOG: MenuItem[] = menus as MenuItem[];

const BY_ID = new Map<string, MenuItem>(CATALOG.map((m) => [m.id, m]));

export function getMenuById(id: string): MenuItem | undefined {
  return BY_ID.get(id);
}
