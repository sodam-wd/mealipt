import { Link } from 'react-router-dom';
import { DecoImg } from './DecoImg';

export function HeroActionCard({
  to,
  image,
  eyebrow,
  title,
  desc,
  variant,
}: {
  to: string;
  image: string;
  eyebrow: string;
  title: string;
  desc: string;
  variant?: 'solo' | 'share' | 'archive';
}) {
  return (
    <Link to={to} className={`hero-card${variant ? ` hero-card--${variant}` : ''}`}>
      <DecoImg src={image} size={92} />
      <span>
        <span className="hero-card__eyebrow">{eyebrow}</span>
        <br />
        <span className="hero-card__title">{title}</span>
        <br />
        <span className="hero-card__desc">{desc}</span>
      </span>
    </Link>
  );
}
