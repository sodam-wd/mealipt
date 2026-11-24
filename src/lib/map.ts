import type { BuildMapLinks } from '@/types';

/** 외부 지도는 검색 링크만 만든다. API 키/SDK 없음. */
export const buildMapLinks: BuildMapLinks = (menuName, area) => {
  const name = menuName.trim();
  const a = (area ?? '').trim();
  const q = encodeURIComponent(a ? `${a} ${name}` : name);
  return [
    { provider: 'naver', label: '네이버 지도에서 찾기', url: `https://map.naver.com/p/search/${q}` },
    { provider: 'kakao', label: '카카오맵에서 찾기', url: `https://map.kakao.com/link/search/${q}` },
  ];
};
