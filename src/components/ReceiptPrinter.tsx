import { useState, type ReactNode } from 'react';
import { DecoImg } from './DecoImg';
import { ASSET } from './assets';
import { prefersReducedMotion } from './receiptUtil';

/**
 * 프린터에서 영수증이 출력되는 모션. reduced-motion 이면 즉시 표시.
 * "다시 인쇄" 로 key 를 바꿔 애니메이션을 재생한다.
 */
export function ReceiptPrinter({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(0);
  const animate = !prefersReducedMotion();

  return (
    <div>
      <div className={`printer${animate ? ' printer--run' : ''}`} key={run}>
        <div className="printer__body">
          <DecoImg src={ASSET.printer} size={150} />
        </div>
        <div className="printer__slot">
          <div className="printer__paper">{children}</div>
        </div>
      </div>
      {animate && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
          <button type="button" className="link-btn" onClick={() => setRun((n) => n + 1)}>
            다시 인쇄하기
          </button>
        </div>
      )}
    </div>
  );
}
