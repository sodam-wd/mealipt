import { useEffect, useRef, useState } from 'react';
import { REJECTION_CODES, REJECTION_LABEL, type RejectionCode } from '@/types';
import { PencilCheckbox } from './PencilCheckbox';

export function RejectReasonSheet({
  menuName,
  onConfirm,
  onCancel,
}: {
  menuName: string;
  onConfirm: (reasons: RejectionCode[]) => void;
  onCancel: () => void;
}) {
  const [reasons, setReasons] = useState<RejectionCode[]>([]);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  return (
    <form
      className="reject-sheet"
      role="group"
      aria-labelledby="reject-title"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(reasons);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <h3 id="reject-title" ref={title} tabIndex={-1}>{menuName}, 왜 별로인가요?</h3>
      <p className="muted small">고른 이유가 다음 추천에 반영돼요. 비워도 괜찮아요.</p>
      <div className="choices" style={{ marginTop: 8 }}>
        {REJECTION_CODES.map((c) => (
          <PencilCheckbox
            key={c}
            label={REJECTION_LABEL[c]}
            checked={reasons.includes(c)}
            onChange={(on) => setReasons(on ? [...reasons, c] : reasons.filter((x) => x !== c))}
          />
        ))}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button type="submit" className="btn btn--primary">다시 추천받기</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}
