import { asset } from './assets';

/** 장식 이미지: 의미 없으므로 alt="" + aria-hidden. */
export function DecoImg({ src, className, size }: { src: string; className?: string; size?: number }) {
  return (
    <img
      src={asset(src)}
      alt=""
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      decoding="async"
      loading="lazy"
    />
  );
}
