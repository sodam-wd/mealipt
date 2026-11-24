import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { NearbyFinder } from '@/components/NearbyFinder';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { ReceiptPrinter } from '@/components/ReceiptPrinter';
import { ShareLinkPanel } from '@/components/ShareLinkPanel';
import { useReceipts } from '@/hooks/useReceipts';
import type { Receipt } from '@/types';

interface NavState {
  receipt?: Receipt;
  saveError?: string | null;
}

export function ReceiptPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { receipts, remove } = useReceipts();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = (location.state ?? {}) as NavState;
  const stored = receipts.find((r) => r.id === id);
  const receipt = stored ?? (state.receipt?.id === id ? state.receipt : undefined);
  const fresh = location.pathname.startsWith('/receipt/');
  const backTo = fresh ? { to: '/', label: '홈' } : { to: '/archive', label: '보관함' };

  if (!receipt) {
    return (
      <AppLayout back={backTo}>
        <EmptyState
          title="밥수증을 찾을 수 없어요"
          actions={<Link className="btn btn--primary" to="/archive">보관함으로</Link>}
        >
          삭제되었거나 다른 브라우저에 저장된 밥수증일 수 있어요.
        </EmptyState>
      </AppLayout>
    );
  }

  const del = () => {
    const r = remove(receipt.id);
    if (!r.ok && r.error !== 'not_found') {
      setError(r.message);
      setConfirming(false);
      return;
    }
    navigate('/archive');
  };

  const isFinal = receipt.receiptType === 'final';

  return (
    <AppLayout back={backTo}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 className="page-title">{isFinal ? '밥수증 발행' : '취향 밥수증'}</h1>
        {fresh && stored && <span className="stamp stamp-in" aria-label="보관함에 저장됨">보관됨</span>}
      </div>

      <div className="stack-lg">
        {state.saveError && fresh && (
          <p className="notice notice--error" role="alert">
            보관함에 저장하지 못했어요: {state.saveError} 이 화면을 벗어나면 사라질 수 있으니 공유 링크로 따로 보관해 주세요.
          </p>
        )}

        {fresh ? (
          <ReceiptPrinter>
            <ReceiptPreview receipt={receipt} />
          </ReceiptPrinter>
        ) : (
          <ReceiptPreview receipt={receipt} />
        )}

        {isFinal && <NearbyFinder menuName={receipt.selectedMenuName} />}

        <section className="stack" aria-labelledby="share-title">
          <h2 className="section-title" id="share-title">{isFinal ? '결과 공유하기' : '취향 링크 공유하기'}</h2>
          <ShareLinkPanel
            payload={isFinal ? { kind: 'final', receipt } : { kind: 'profile', profile: receipt.profile, groupLabel: receipt.groupLabel }}
            title="밥수증"
            shareText={isFinal ? `오늘은 ${receipt.selectedMenuName}!` : '내 취향 밥수증이에요.'}
          />
        </section>

        <section className="stack" aria-label="관리">
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          {stored && !confirming && (
            <button type="button" className="btn btn--ghost btn--danger" onClick={() => setConfirming(true)}>이 밥수증 삭제</button>
          )}
          {confirming && (
            <div className="notice notice--error" role="alertdialog" aria-label="삭제 확인">
              <p>이 밥수증을 삭제할까요? 되돌릴 수 없어요.</p>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn--sm btn--primary" onClick={del}>삭제</button>
                <button type="button" className="btn btn--sm" onClick={() => setConfirming(false)}>취소</button>
              </div>
            </div>
          )}
          <div className="row">
            <Link className="btn" to="/archive">보관함</Link>
            <Link className="btn btn--ghost" to="/">홈으로</Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
