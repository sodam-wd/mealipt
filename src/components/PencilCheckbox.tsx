import { useId } from 'react';

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** check: 체크(✓) / radio: 동그라미 / cross: 제외용 ✕ */
  variant?: 'check' | 'radio' | 'cross';
  name?: string;
  disabled?: boolean;
}

/**
 * 연필 체크. 실제 input 은 시각적으로만 숨기고(키보드/스크린리더 유지),
 * 체크 표시는 SVG stroke-dashoffset 애니메이션(CSS)으로 그린다.
 */
export function PencilCheckbox({ label, checked, onChange, variant = 'check', name, disabled }: Props) {
  const id = useId();
  const radio = variant === 'radio';
  return (
    <label htmlFor={id} className={`pencil pencil--${variant}`}>
      <input
        id={id}
        className="pencil__input"
        type={radio ? 'radio' : 'checkbox'}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="pencil__box" aria-hidden="true">
        <svg className="pencil__svg" viewBox="0 0 40 40">
          {variant === 'check' && (
            <>
              <path className="pencil__stroke pencil__stroke--ghost" pathLength={1} d="M6.8 22.6 Q11 26.4 16.2 30.6 Q25 18.4 35.4 6.8" />
              <path className="pencil__stroke" pathLength={1} d="M5.8 21.4 Q10.2 24.8 15.4 31.8 Q24.4 16.8 36.8 5.2" />
            </>
          )}
          {variant === 'cross' && (
            <>
              <path className="pencil__stroke pencil__stroke--ghost" pathLength={1} d="M10.2 11.4 Q19 19 30.6 31.2" />
              <path className="pencil__stroke" pathLength={1} d="M8.6 9.6 Q19.4 20.2 31.8 32.6" />
              <path className="pencil__stroke pencil__stroke--ghost pencil__stroke--b" pathLength={1} d="M30.4 10.6 Q20 21 10.8 31.6" />
              <path className="pencil__stroke pencil__stroke--b" pathLength={1} d="M31.6 8.6 Q19.6 19.4 9.2 33.4" />
            </>
          )}
          {radio && (
            <>
              <path className="pencil__stroke pencil__stroke--ghost pencil__stroke--round" pathLength={1} d="M24.6 9.6 C15.6 8.2 9.2 14.6 9.8 22 C10.6 30 18 33 25.4 30.4 C32 27.6 33 19 29 13.4 C27.4 11 25.4 10.4 23.4 10.8" />
              <path className="pencil__stroke pencil__stroke--round" pathLength={1} d="M23.8 8.2 C14.2 7 7.6 14 8.4 22.4 C9.4 31.4 18.4 34.4 26.2 31 C33.6 27.8 34.2 18 29.6 12.2 C27.8 9.6 25.2 8.8 22.2 9.4" />
            </>
          )}
        </svg>
      </span>
      <span className="pencil__text">{label}</span>
    </label>
  );
}
