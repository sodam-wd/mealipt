import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { HeroActionCard } from '@/components/HeroActionCard';
import { ASSET, asset } from '@/components/assets';
import { formatDate } from '@/components/receiptUtil';
import { useReceipts } from '@/hooks/useReceipts';
import { loadDraft } from '@/lib/storage';
import type { ActiveDraft } from '@/types';

function resumeTarget(d: ActiveDraft): { to: string; label: string } {
  switch (d.flow) {
    case 'solo':
      return { to: d.step === 'result' ? '/solo/result' : '/solo', label: '혼자 먹기' };
    case 'share-create':
      return { to: '/share/create', label: '내 취향 밥수증 만들기' };
    case 'share-merge':
      return { to: d.step === 'result' ? '/share/result' : '/share/merge', label: '밥수증 합치기' };
  }
}

export function HomePage() {
  const { receipts } = useReceipts();
  const draft = useMemo(() => {
    try {
      return loadDraft();
    } catch {
      return null;
    }
  }, []);
  const resume = draft ? resumeTarget(draft) : null;
  const recent = receipts.filter((r) => r.receiptType === 'final').slice(0, 3);

  return (
    <AppLayout wide hideLogoImage>
      <section className="home-hero">
        <h1 className="sr-only">밥수증 mealipt. 오늘 뭐 먹지</h1>
        <img className="home-hero__logo" src={asset(ASSET.logo)} alt="밥수증 mealipt." width={220} height={220} />
        <p className="home-hero__copy">오늘 뭐 먹지? 주문서에 체크하고 영수증으로 받아가세요.</p>
        <p className="home-hero__sub">취향을 고르면 메뉴를 추천하고, 결정하면 밥수증을 발행해요.</p>
      </section>

      {resume && (
        <div className="resume" role="region" aria-label="진행 중인 작업">
          <span>
            <strong>{resume.label}</strong> 진행 중인 주문서가 있어요.
          </span>
          <Link className="btn btn--sm btn--primary" to={resume.to}>이어하기</Link>
        </div>
      )}

      <nav className="hero-actions" aria-label="시작하기">
        <HeroActionCard to="/solo" image={ASSET.solo} eyebrow="SOLO TABLE" title="혼자 먹기" desc="내 취향으로 바로 추천받아요" variant="solo" />
        <HeroActionCard to="/share" image={ASSET.share} eyebrow="SHARE TABLE" title="함께 먹기" desc="각자의 밥수증을 합쳐 함께 정해요" variant="share" />
        <HeroActionCard to="/archive" image={ASSET.archive} eyebrow="ARCHIVE" title="보관함" desc="지난 밥수증과 통계를 봐요" variant="archive" />
      </nav>

      {recent.length > 0 && (
        <section className="sheet sheet--plain" style={{ marginTop: 28 }} aria-labelledby="recent-title">
          <h2 className="section-title" id="recent-title">최근 밥수증</h2>
          <ul className="mini-list">
            {recent.map((r) =>
              r.receiptType === 'final' ? (
                <li key={r.id}>
                  <Link to={`/archive/${r.id}`}>{r.selectedMenuName}</Link>
                  <span className="mono small muted">{formatDate(r.createdAt).slice(0, 10)}</span>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      <p className="muted small" style={{ textAlign: 'center', marginTop: 28 }}>
        서버도 로그인도 없어요. 기록은 이 브라우저에만 저장돼요.
      </p>
    </AppLayout>
  );
}
