import type { ReactNode } from 'react';
import type { ScoredMenu } from '@/types';
import { CATEGORY_LABEL } from '@/types';
import { priceText } from './receiptUtil';

interface Props {
  item: ScoredMenu;
  variant: 'main' | 'alt';
  eyebrow?: string;
  actions?: ReactNode;
}

export function RecommendationCard({ item, variant, eyebrow, actions }: Props) {
  const { menu, score, reasons } = item;
  return (
    <article className={`pick pick--${variant}`} aria-label={`${menu.name} 추천`}>
      <p className="pick__eyebrow">{eyebrow ?? (variant === 'main' ? '오늘의 1순위' : '이런 메뉴는 어때요')}</p>
      {variant === 'main' ? <h2 className="pick__name">{menu.name}</h2> : <h3 className="pick__name">{menu.name}</h3>}
      <div className="pick__meta">
        <span>{CATEGORY_LABEL[menu.category]}</span>
        <span>예상 {priceText(menu)}</span>
        <span className="pick__score">
          일치 <strong>{score}</strong>점
        </span>
      </div>
      {reasons.length > 0 && (
        <ul className="pick__reasons" aria-label="추천 이유">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {actions && <div className="pick__actions">{actions}</div>}
    </article>
  );
}
