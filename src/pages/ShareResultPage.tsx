import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { RecommendationFlow } from '@/components/RecommendationFlow';
import { emptyContext, uniqueReasons } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { CATALOG_VERSION } from '@/data/catalog';
import { applyRejection, rankGroup } from '@/features/recommendation';
import { useReceipts } from '@/hooks/useReceipts';
import { createId } from '@/lib/id';
import type { FinalReceipt, RejectionCode, ScoredMenu } from '@/types';

export function ShareResultPage() {
  const navigate = useNavigate();
  const { draft, update, reset } = useFlowDraft('share-merge');
  const { save } = useReceipts();
  const profiles = draft?.profiles;
  const context = draft?.context;

  const result = useMemo(
    () => (profiles && profiles.length > 0 && context ? rankGroup(profiles, context) : null),
    [profiles, context],
  );

  if (!draft || !profiles || profiles.length === 0 || !context || !result) {
    return (
      <AppLayout back={{ to: '/share', label: '함께 먹기' }}>
        <EmptyState title="합친 밥수증이 없어요" image="ui/receipt-stack.png" actions={<Link className="btn btn--primary" to="/share/merge">밥수증 합치기</Link>}>
          먼저 친구들의 취향 밥수증 링크를 모아 주세요.
        </EmptyState>
      </AppLayout>
    );
  }

  const sortedIds = [...profiles.map((p) => p.id)].sort();
  // 시드: 모임 구성(정렬된 id)으로 영수증 번호를 고정한다.
  const seed = sortedIds.join('|');

  const decide = (item: ScoredMenu) => {
    const receipt: FinalReceipt = {
      id: createId('r'),
      receiptType: 'final',
      mode: 'share',
      createdAt: new Date().toISOString(),
      groupLabel: draft.groupLabel,
      sourceSheetIds: sortedIds,
      participantCount: profiles.length,
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
    navigate('/share/merge');
  };

  return (
    <AppLayout back={{ to: '/share/merge', label: '합치기' }}>
      <h1 className="page-title" style={{ marginBottom: 6 }}>우리의 추천</h1>
      <p className="page-lead" style={{ marginBottom: 14 }}>
        {draft.groupLabel ? `${draft.groupLabel} · ` : ''}참여 {profiles.length}명의 취향을 합쳤어요.
      </p>
      <RecommendationFlow
        result={result}
        round={draft.round}
        seed={seed}
        onDecide={decide}
        onReject={reject}
        onEdit={edit}
        editLabel="참여자 다시 고르기"
        intro={
          <p className="notice">
            함께 이야기해서 정한 뒤, 결정하는 한 사람이 기록해 주세요. 개인별 점수와 이유는 보여주지 않아요. 마음에 안 들면 "별로예요"로 이유를 남기고 다시 추천받을 수 있어요.
          </p>
        }
      />
    </AppLayout>
  );
}
