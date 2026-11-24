import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { RecommendationFlow } from '@/components/RecommendationFlow';
import { emptyContext, uniqueReasons } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { CATALOG_VERSION } from '@/data/catalog';
import { applyRejection, rankMenus } from '@/features/recommendation';
import { useReceipts } from '@/hooks/useReceipts';
import { createId } from '@/lib/id';
import type { FinalReceipt, RejectionCode, ScoredMenu } from '@/types';

export function SoloResultPage() {
  const navigate = useNavigate();
  const { draft, update, reset } = useFlowDraft('solo');
  const { save } = useReceipts();
  const sheet = draft?.sheet;
  const context = draft?.context;

  const result = useMemo(() => (sheet && context ? rankMenus(sheet, context) : null), [sheet, context]);

  if (!draft || !sheet || !context || !result) {
    return (
      <AppLayout back={{ to: '/' }}>
        <EmptyState title="진행 중인 주문서가 없어요" actions={<Link className="btn btn--primary" to="/solo">주문서 쓰러 가기</Link>}>
          먼저 취향을 체크하면 추천을 보여드려요.
        </EmptyState>
      </AppLayout>
    );
  }

  const decide = (item: ScoredMenu) => {
    const receipt: FinalReceipt = {
      id: createId('r'),
      receiptType: 'final',
      mode: 'solo',
      createdAt: new Date().toISOString(),
      sourceSheetIds: [sheet.id],
      participantCount: 1,
      round: draft.round,
      selectedMenuId: item.menu.id,
      selectedMenuName: item.menu.name,
      selectedCategory: item.menu.category,
      score: item.score,
      rejectedReasonCodes: uniqueReasons(context),
      catalogVersion: CATALOG_VERSION,
    };
    const r = save(receipt);
    reset();
    navigate(`/receipt/${receipt.id}`, { state: { receipt, saveError: r.ok ? null : r.message } });
  };

  const reject = (item: ScoredMenu, reasons: RejectionCode[]) => {
    update({ ...draft, context: applyRejection(context, item.menu.id, reasons), round: draft.round + 1 });
  };

  const edit = () => {
    update({ ...draft, step: 'form', context: emptyContext(context.recentMenuIds), round: 1 });
    navigate('/solo');
  };

  return (
    <AppLayout back={{ to: '/solo', label: '주문서' }}>
      <h1 className="page-title" style={{ marginBottom: 14 }}>오늘의 추천</h1>
      <RecommendationFlow
        result={result}
        round={draft.round}
        seed={sheet.id}
        onDecide={decide}
        onReject={reject}
        onEdit={edit}
        editLabel="조건 수정하기"
      />
    </AppLayout>
  );
}
