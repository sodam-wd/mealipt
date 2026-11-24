import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageBanner } from '@/components/StorageBanner';
import { AppLayout } from '@/components/AppLayout';
import { DecoImg } from '@/components/DecoImg';
import { ASSET } from '@/components/assets';
import { OrderSheetForm } from '@/components/OrderSheetForm';
import { emptyContext, newSheet, recentMenuIdsFrom } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { useReceipts } from '@/hooks/useReceipts';
import type { ActiveDraft, PreferenceSheet } from '@/types';

export function SoloFormPage() {
  const navigate = useNavigate();
  const { draft, update, reset } = useFlowDraft('solo');
  const { receipts } = useReceipts();
  const [fresh] = useState(() => newSheet('solo'));
  const sheet: PreferenceSheet = draft?.sheet ?? fresh;
  const [resumed, setResumed] = useState(!!draft?.sheet);

  const save = (s: PreferenceSheet, step: ActiveDraft['step'] = 'form', ctx = draft?.context ?? emptyContext(), round = draft?.round ?? 1) =>
    update({ flow: 'solo', step, sheet: s, context: ctx, round, updatedAt: '' });

  const submit = () => {
    // 새 추천 시작: 거절 기록과 라운드를 초기화한다.
    save(sheet, 'result', emptyContext(recentMenuIdsFrom(receipts)), 1);
    navigate('/solo/result');
  };

  return (
    <AppLayout back={{ to: '/' }}>
      <div className="page-head">
        <DecoImg className="page-head__art" src={ASSET.clipboard} size={84} />
        <div>
          <h1 className="page-title">혼자 먹기 주문서</h1>
          <p className="page-lead">오늘 기분에 연필로 체크해 주세요.</p>
        </div>
      </div>

      <StorageBanner />
      {resumed && (
        <p className="notice" role="status" style={{ marginBottom: 14 }}>
          작성 중이던 주문서를 불러왔어요.{' '}
          <button type="button" className="link-btn" onClick={() => { reset(); setResumed(false); }}>처음부터 다시 쓰기</button>
        </p>
      )}

      <OrderSheetForm
        key={sheet.id}
        sheet={sheet}
        onChange={(s) => save(s)}
        onSubmit={submit}
        submitLabel="추천받기"
      />
    </AppLayout>
  );
}
