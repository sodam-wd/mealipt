import { useMemo, useState } from 'react';
import { buildMapLinks } from '@/lib/map';
import { DecoImg } from './DecoImg';
import { ASSET } from './assets';

/** 외부 지도 검색 링크만 연결한다 (API 키/지도 SDK 없음). */
export function NearbyFinder({ menuName }: { menuName: string }) {
  const [area, setArea] = useState('');
  const links = useMemo(() => buildMapLinks(menuName, area.trim() || undefined), [menuName, area]);

  return (
    <section className="nearby stack" aria-labelledby="nearby-title">
      <h2 className="section-title" id="nearby-title">근처 식당 찾기</h2>
      <div>
        <label className="label" htmlFor="area">지역 (선택)</label>
        <input id="area" className="input" value={area} maxLength={30} placeholder="예: 합정역, 강남구" autoComplete="off" onChange={(e) => setArea(e.target.value)} />
      </div>
      <div className="row">
        {links.map((l) => (
          <a key={l.provider} className="btn" href={l.url} target="_blank" rel="noopener noreferrer">
            <DecoImg src={ASSET.mapPin} size={24} />
            {l.label}
            <span className="sr-only"> (새 탭에서 열림)</span>
          </a>
        ))}
      </div>
      <p className="small muted">
        외부 지도 앱의 검색 결과로 이동해요. 실제 영업 여부, 가격, 알레르기 정보는 보장하지 않으니 방문 전에 직접 확인해 주세요.
      </p>
    </section>
  );
}
