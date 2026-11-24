import { useRef, useState, type ReactNode } from 'react';
import type { RankResult, RejectionCode, ScoredMenu } from '@/types';
import { EmptyState } from './EmptyState';
import { RecommendationCard } from './RecommendationCard';
import { RejectReasonSheet } from './RejectReasonSheet';
import { receiptNo } from './receiptUtil';

interface Props {
  result: RankResult;
  round: number;
  /** 영수증 번호 시드(주문서/모임 id) */
  seed: string;
  onDecide: (item: ScoredMenu) => void;
  onReject: (item: ScoredMenu, reasons: RejectionCode[]) => void;
  onEdit: () => void;
  editLabel: string;
  intro?: ReactNode;
}

/** 추천 결과 + 재추천(거절 이유) 공통 흐름. 솔로/공동 결과 화면이 함께 쓴다. */
export function RecommendationFlow({ result, round, seed, onDecide, onReject, onEdit, editLabel, intro }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const rejectBtn = useRef<HTMLButtonElement>(null);
  const closeSheet = () => {
    setRejecting(false);
    setTimeout(() => rejectBtn.current?.focus(), 0);
  };

  if (!result.ok) {
    return (
      <EmptyState
        title="조건에 맞는 메뉴가 없어요"
        hints={result.relax.map((r) => r.label)}
        actions={<button type="button" className="btn btn--primary" onClick={onEdit}>{editLabel}</button>}
      >
        조건이 너무 빡빡하거나 이미 거절한 메뉴가 많아요. 아래 중에서 풀어보세요.
      </EmptyState>
    );
  }

  const [main, ...rest] = result.items;
  const alts = rest.slice(0, 2);
  if (!main) return null;

  return (
    <div className="stack-lg">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="round-chip" aria-live="polite">NO. {receiptNo(seed, round)} · {round}번째 추천</span>
        <button type="button" className="link-btn" onClick={onEdit}>{editLabel}</button>
      </div>
      {intro}

      <div className="stack">
        <RecommendationCard
          item={main}
          variant="main"
          actions={
            <>
              <button type="button" className="btn btn--primary" onClick={() => onDecide(main)}>이걸로 결정</button>
              <button ref={rejectBtn} type="button" className="btn" aria-expanded={rejecting} onClick={() => setRejecting(true)}>별로예요</button>
            </>
          }
        />
        {rejecting && (
          <RejectReasonSheet
            menuName={main.menu.name}
            onCancel={closeSheet}
            onConfirm={(reasons) => {
              setRejecting(false);
              setTimeout(() => rejectBtn.current?.focus(), 0);
              onReject(main, reasons);
            }}
          />
        )}
      </div>

      {alts.length > 0 && (
        <section className="stack" aria-label="다른 후보">
          <h2 className="section-title">이런 선택도 있어요</h2>
          {alts.map((a) => (
            <RecommendationCard
              key={a.menu.id}
              item={a}
              variant="alt"
              eyebrow="대안"
              actions={<button type="button" className="btn btn--sm" onClick={() => onDecide(a)}>이걸로 결정</button>}
            />
          ))}
        </section>
      )}
    </div>
  );
}
