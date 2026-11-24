import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StorageBanner } from '@/components/StorageBanner';
import { AppLayout } from '@/components/AppLayout';
import { DecoImg } from '@/components/DecoImg';
import { ASSET } from '@/components/assets';
import { OrderSheetForm } from '@/components/OrderSheetForm';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { ReceiptPrinter } from '@/components/ReceiptPrinter';
import { ShareLinkPanel } from '@/components/ShareLinkPanel';
import { emptyContext, newSheet } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { toShareProfile } from '@/features/share';
import { useReceipts } from '@/hooks/useReceipts';
import { createId } from '@/lib/id';
import type { PreferenceSheet, ProfileReceipt } from '@/types';

export function ShareCreatePage() {
  const { draft, update, reset } = useFlowDraft('share-create');
  const { save } = useReceipts();
  const [fresh] = useState(() => newSheet('share-profile'));
  const [published, setPublished] = useState<ProfileReceipt | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(!!draft?.sheet);
  const sheet: PreferenceSheet = draft?.sheet ?? fresh;

  const change = (s: PreferenceSheet) =>
    update({ flow: 'share-create', step: 'form', sheet: s, context: emptyContext(), round: 1, updatedAt: '' });

  const publish = () => {
    const receipt: ProfileReceipt = {
      id: createId('r'),
      receiptType: 'profile',
      mode: 'share',
      createdAt: new Date().toISOString(),
      profile: toShareProfile({ ...sheet, type: 'share-profile' }),
    };
    const r = save(receipt);
    setSaveError(r.ok ? null : r.message);
    setPublished(receipt);
    reset();
  };

  if (published) {
    return (
      <AppLayout back={{ to: '/share', label: '함께 먹기' }}>
        <h1 className="page-title" style={{ marginBottom: 14 }}>취향 밥수증 발행 완료</h1>
        <div className="stack-lg">
          <ReceiptPrinter>
            <ReceiptPreview receipt={published} />
          </ReceiptPrinter>
          {saveError && <p className="notice notice--error" role="alert">보관함에 저장하지 못했어요: {saveError} 링크로는 계속 공유할 수 있어요.</p>}
          <section className="stack" aria-labelledby="send">
            <h2 className="section-title" id="send">링크를 친구에게 보내세요</h2>
            <ShareLinkPanel
              payload={{ kind: 'profile', profile: published.profile, groupLabel: published.groupLabel }}
              title="밥수증 취향 링크"
              shareText="내 취향 밥수증이에요. 합치기에 추가해 주세요!"
            />
          </section>
          <div className="row">
            <Link className="btn" to="/share/merge">밥수증 합치기로</Link>
            <Link className="btn btn--ghost" to="/archive">보관함 보기</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout back={{ to: '/share', label: '함께 먹기' }}>
      <div className="page-head">
        <DecoImg className="page-head__art" src={ASSET.clipboard} size={84} />
        <div>
          <h1 className="page-title">내 취향 밥수증</h1>
          <p className="page-lead">메뉴는 고르지 않고, 내 취향만 영수증으로 발행해요.</p>
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
        onChange={change}
        onSubmit={publish}
        submitLabel="취향 밥수증 발행하기"
        showName
        footer={<p className="notice">발행하면 링크가 만들어져요. 링크는 암호화가 아니며 링크를 가진 사람은 내용을 볼 수 있어요. 자동 동기화는 되지 않아요.</p>}
      />
    </AppLayout>
  );
}
