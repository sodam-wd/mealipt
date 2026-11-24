import { CATEGORY_LABEL, type Stats } from '@/types';
import { formatDate } from './receiptUtil';

export function StatsSummary({ stats }: { stats: Stats }) {
  const solo = Math.round(stats.soloRatio * 100);
  const hasFinal = stats.finalCount > 0;
  return (
    <section className="sheet sheet--plain stack" aria-labelledby="stats-title">
      <h2 className="section-title" id="stats-title">내 밥수증 장부</h2>
      <div className="stats-grid">
        <div className="ledger">
          <dl>
            <div className="ledger__row"><dt>총 발행</dt><dd>{stats.total}장</dd></div>
            <div className="ledger__row"><dt>최종 밥수증</dt><dd>{stats.finalCount}장</dd></div>
            <div className="ledger__row"><dt>취향 밥수증</dt><dd>{stats.profileCount}장</dd></div>
            <div className="ledger__row"><dt>평균 추천 시도</dt><dd>{hasFinal ? `${stats.avgRounds.toFixed(1)}회` : '-'}</dd></div>
          </dl>
          <div role="img" aria-label={hasFinal ? `혼자 ${stats.soloCount}장, 함께 ${stats.shareCount}장` : '아직 최종 밥수증이 없어요'}>
            <div className="ratio">
              <div className="ratio__solo" style={{ width: `${hasFinal ? solo : 0}%` }} />
              <div className="ratio__share" style={{ width: `${hasFinal ? 100 - solo : 0}%` }} />
            </div>
            <div className="ratio-legend" aria-hidden="true">
              <span>혼자 {stats.soloCount}</span>
              <span>함께 {stats.shareCount}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="hand" style={{ fontSize: '1.2rem' }}>최근 메뉴</h3>
          {stats.recentMenus.length ? (
            <ul className="mini-list">
              {stats.recentMenus.map((m) => (
                <li key={`${m.menuId}-${m.createdAt}`}><span>{m.name}</span><span className="mono small muted">{formatDate(m.createdAt).slice(5, 10)}</span></li>
              ))}
            </ul>
          ) : (
            <p className="muted small">아직 없어요.</p>
          )}
          <h3 className="hand" style={{ fontSize: '1.2rem', marginTop: 12 }}>자주 고른 종류</h3>
          {stats.topCategories.length ? (
            <ul className="mini-list">
              {stats.topCategories.map((c) => (
                <li key={c.category}><span>{CATEGORY_LABEL[c.category]}</span><span className="mono small">{c.count}회</span></li>
              ))}
            </ul>
          ) : (
            <p className="muted small">아직 없어요.</p>
          )}
        </div>
      </div>
      {stats.byGroup.length > 0 && (
        <div>
          <h3 className="hand" style={{ fontSize: '1.2rem' }}>모임별</h3>
          <ul className="mini-list">
            {stats.byGroup.map((g) => (
              <li key={g.label}>
                <span>
                  <strong>{g.label}</strong>
                  {g.recentMenus.length > 0 && <span className="muted small"> · {g.recentMenus.join(', ')}</span>}
                </span>
                <span className="mono small">
                  {g.finalCount}회{g.topCategory ? ` · ${CATEGORY_LABEL[g.topCategory]}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
