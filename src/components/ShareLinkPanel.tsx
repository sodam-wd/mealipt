import { useMemo, useState } from 'react';
import { buildShareUrl } from '@/lib/codec';
import type { SharePayload } from '@/types';

export const SHARE_NOTICE =
  '링크는 암호화가 아니며 링크를 가진 사람은 내용을 볼 수 있어요. 사용자 간 자동 동기화는 되지 않아요.';

export function ShareLinkPanel({ payload, title, shareText }: { payload: SharePayload; title: string; shareText: string }) {
  const [msg, setMsg] = useState('');
  const [failed, setFailed] = useState(false);

  const url = useMemo(() => {
    try {
      return buildShareUrl(payload);
    } catch {
      return '';
    }
  }, [payload]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setFailed(false);
      setMsg('링크를 복사했어요. 메신저에 붙여넣어 보내세요.');
    } catch {
      setFailed(true);
      setMsg('자동 복사에 실패했어요. 아래 링크를 길게 눌러 직접 복사해 주세요.');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      /* 사용자가 취소한 경우 등 — 무시 */
    }
  };

  if (!url) {
    return <p className="notice notice--error">공유 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.</p>;
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <section className="stack" aria-label="공유 링크">
      <div className="row">
        <button type="button" className="btn btn--olive" onClick={copy}>링크 복사</button>
        {canShare && (
          <button type="button" className="btn" onClick={nativeShare}>공유하기</button>
        )}
      </div>
      <p role="status" className={failed ? 'notice notice--error' : 'small muted'} hidden={!msg}>{msg}</p>
      <code className="share-link" tabIndex={0} aria-label="공유 링크 주소">{url}</code>
      <p className="notice">{SHARE_NOTICE}</p>
    </section>
  );
}
