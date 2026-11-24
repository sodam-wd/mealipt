import type { ReactNode } from 'react';
import { DecoImg } from './DecoImg';
import { ASSET } from './assets';

export function EmptyState({
  title,
  children,
  image = ASSET.emptyPlate,
  actions,
  hints,
}: {
  title: string;
  children?: ReactNode;
  image?: string;
  actions?: ReactNode;
  hints?: string[];
}) {
  return (
    <section className="empty">
      <DecoImg src={image} size={140} />
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {hints && hints.length > 0 && (
        <ul>
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {actions && <div className="row">{actions}</div>}
    </section>
  );
}
