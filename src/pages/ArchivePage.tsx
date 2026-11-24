import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ArchiveReceiptList } from '@/components/ArchiveReceiptList';
import { DecoImg } from '@/components/DecoImg';
import { EmptyState } from '@/components/EmptyState';
import { StatsSummary } from '@/components/StatsSummary';
import { ASSET } from '@/components/assets';
import { useReceipts } from '@/hooks/useReceipts';
import type { Receipt } from '@/types';

type Filter = 'all' | 'solo' | 'share' | 'profile';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'solo', label: '혼자' },
  { key: 'share', label: '함께' },
  { key: 'profile', label: '취향 밥수증' },
];

function matches(r: Receipt, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'profile') return r.receiptType === 'profile';
  return r.receiptType === 'final' && r.mode === f;
}

export function ArchivePage() {
  const { receipts, stats, remove, clearAll, storageAvailable } = useReceipts();
  const [filter, setFilter] = useState<Filter>('all');
  const [group, setGroup] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => [...new Set(receipts.map((r) => r.groupLabel).filter((g): g is string => !!g))], [receipts]);
  const shown = receipts.filter((r) => matches(r, filter) && (!group || r.groupLabel === group));

  const del = (r: Receipt) => {
    const res = remove(r.id);
    setError(res.ok ? null : res.message);
  };
  const delAll = () => {
    const res = clearAll();
    setError(res.ok ? null : res.message);
    setConfirmAll(false);
  };

  return (
    <AppLayout back={{ to: '/' }}>
      <div className="page-head">
        <DecoImg className="page-head__art" src={ASSET.archive} size={84} />
        <div>
          <h1 className="page-title">보관함</h1>
          <p className="page-lead">지금까지 발행한 밥수증이에요.</p>
        </div>
      </div>

      <div className="stack-lg">
        <p className="notice">
          이 브라우저에만 저장돼요. 다른 브라우저나 기기에서는 보이지 않고, 브라우저 기록을 지우면 사라져요.
        </p>
        {!storageAvailable && (
          <p className="notice notice--error" role="alert">
            이 브라우저에서는 저장을 사용할 수 없어요. 시크릿 모드이거나 저장이 차단되어 있을 수 있어요. 밥수증은 공유 링크로 따로 보관해 주세요.
          </p>
        )}
        {error && <p className="notice notice--error" role="alert">{error}</p>}

        {receipts.length === 0 ? (
          <EmptyState
            title="아직 밥수증이 없어요"
            actions={
              <>
                <Link className="btn btn--primary" to="/solo">혼자 먹기</Link>
                <Link className="btn" to="/share">함께 먹기</Link>
              </>
            }
          >
            메뉴를 정하면 이곳에 영수증이 쌓여요.
          </EmptyState>
        ) : (
          <>
            <StatsSummary stats={stats} />

            <section className="stack" aria-labelledby="list-title">
              <h2 className="section-title" id="list-title">밥수증 목록</h2>
              <div className="filters" role="group" aria-label="종류 필터">
                {FILTERS.map((f) => (
                  <button key={f.key} type="button" className="filter-pill" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {groups.length > 0 && (
                <div className="filters" role="group" aria-label="모임 필터">
                  <button type="button" className="filter-pill" aria-pressed={group === null} onClick={() => setGroup(null)}>모든 모임</button>
                  {groups.map((g) => (
                    <button key={g} type="button" className="filter-pill" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)}>
                      {g}
                    </button>
                  ))}
                </div>
              )}
              {shown.length === 0 ? (
                <p className="muted">조건에 맞는 밥수증이 없어요.</p>
              ) : (
                <ArchiveReceiptList receipts={shown} onDelete={del} />
              )}
            </section>

            <section className="stack" aria-label="전체 삭제">
              {!confirmAll ? (
                <button type="button" className="btn btn--ghost btn--danger" onClick={() => setConfirmAll(true)}>전체 기록 삭제</button>
              ) : (
                <div className="notice notice--error" role="alertdialog" aria-label="전체 삭제 확인">
                  <p>이 브라우저에 저장된 모든 밥수증과 진행 중인 작업이 삭제돼요. 되돌릴 수 없어요.</p>
                  <div className="row" style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn--sm btn--primary" onClick={delAll}>모두 삭제</button>
                    <button type="button" className="btn btn--sm" onClick={() => setConfirmAll(false)}>취소</button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
