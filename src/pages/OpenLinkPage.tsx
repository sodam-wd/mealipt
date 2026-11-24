import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { emptyContext } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { addProfile } from '@/features/share';
import { useReceipts } from '@/hooks/useReceipts';
import { decodeShareInput } from '@/lib/codec';
import type { ProfileReceipt } from '@/types';

export function OpenLinkPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const raw = params.get('r') ?? '';
  const decoded = useMemo(() => decodeShareInput(raw), [raw]);
  const { draft, update } = useFlowDraft('share-merge');
  const { receipts, save } = useReceipts();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!decoded.ok) {
    return (
      <AppLayout back={{ to: '/', label: '홈' }}>
        <EmptyState title="링크를 열 수 없어요" actions={<Link className="btn btn--primary" to="/">홈으로</Link>}>
          {decoded.message}
        </EmptyState>
      </AppLayout>
    );
  }

  const { payload } = decoded;

  if (payload.kind === 'profile') {
    const { profile, groupLabel } = payload;
    const preview: ProfileReceipt = {
      id: profile.id,
      receiptType: 'profile',
      mode: 'share',
      createdAt: new Date().toISOString(),
      groupLabel,
      profile,
    };
    const addToMerge = () => {
      const current = draft?.profiles ?? [];
      const r = addProfile(current, profile);
      if (!r.ok) {
        setMsg({ ok: false, text: r.message });
        return;
      }
      update({
        flow: 'share-merge',
        step: 'form',
        profiles: r.profiles,
        groupLabel: draft?.groupLabel ?? groupLabel,
        context: draft?.context ?? emptyContext(),
        round: draft?.round ?? 1,
        updatedAt: '',
      });
      navigate('/share/merge');
    };
    return (
      <AppLayout back={{ to: '/', label: '홈' }}>
        <h1 className="page-title" style={{ marginBottom: 6 }}>친구의 취향 밥수증</h1>
        <p className="page-lead" style={{ marginBottom: 16 }}>받은 링크의 내용이에요. 합치기에 추가하면 함께 추천받을 수 있어요.</p>
        <div className="stack-lg">
          <ReceiptPreview receipt={preview} />
          {msg && <p className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`} role="status">{msg.text}</p>}
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={addToMerge}>합치기에 추가</button>
            <Link className="btn btn--ghost" to="/">홈으로</Link>
          </div>
          <p className="notice">링크는 암호화가 아니에요. 이 기기에서만 열어 보며, 자동으로 동기화되지 않아요.</p>
        </div>
      </AppLayout>
    );
  }

  const { receipt } = payload;
  const exists = receipts.some((r) => r.id === receipt.id);
  const saveIt = () => {
    if (exists) {
      setMsg({ ok: true, text: '이미 보관함에 있는 밥수증이에요.' });
      return;
    }
    const r = save(receipt);
    if (r.ok) setMsg({ ok: true, text: '보관함에 저장했어요.' });
    else setMsg({ ok: !r.ok && r.error === 'duplicate', text: r.message });
  };

  return (
    <AppLayout back={{ to: '/', label: '홈' }}>
      <h1 className="page-title" style={{ marginBottom: 6 }}>공유받은 밥수증</h1>
      <p className="page-lead" style={{ marginBottom: 16 }}>받은 링크의 내용이에요.</p>
      <div className="stack-lg">
        <ReceiptPreview receipt={receipt} />
        {msg && <p className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`} role="status">{msg.text}</p>}
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={saveIt} disabled={exists}>
            {exists ? '이미 저장됨' : '보관함에 저장'}
          </button>
          <Link className="btn btn--ghost" to="/archive">보관함 보기</Link>
        </div>
      </div>
    </AppLayout>
  );
}
