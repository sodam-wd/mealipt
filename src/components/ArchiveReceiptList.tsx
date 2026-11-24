import { Link } from 'react-router-dom';
import type { Receipt } from '@/types';
import { CATEGORY_LABEL } from '@/types';
import { formatDate, receiptNo } from './receiptUtil';

function title(r: Receipt): string {
  return r.receiptType === 'final' ? r.selectedMenuName : `${r.profile.name ?? '이름 없음'}의 취향`;
}

export function ArchiveReceiptList({ receipts, onDelete }: { receipts: Receipt[]; onDelete: (r: Receipt) => void }) {
  return (
    <ul className="rlist">
      {receipts.map((r) => {
        const kind = r.receiptType === 'profile' ? 'profile' : r.mode;
        const kindLabel = kind === 'profile' ? '취향' : kind === 'solo' ? '혼자' : '함께';
        return (
          <li className="rlist__item" key={r.id}>
            <Link className="rlist__link" to={`/archive/${r.id}`}>
              <span className="rlist__title">
                {title(r)}
                <span className={`tag tag--${kind}`}>{kindLabel}</span>
                {r.groupLabel && <span className="tag">{r.groupLabel}</span>}
              </span>
              <span className="rlist__meta">
                {formatDate(r.createdAt)} · {r.receiptType === 'final' ? `${receiptNo(r.id, r.round)} · ${CATEGORY_LABEL[r.selectedCategory]}` : `NO. ${receiptNo(r.id, 0).slice(1, 5)}`}
              </span>
            </Link>
            <button type="button" className="rlist__del" onClick={() => onDelete(r)} aria-label={`${title(r)} 밥수증 삭제`}>삭제</button>
          </li>
        );
      })}
    </ul>
  );
}
