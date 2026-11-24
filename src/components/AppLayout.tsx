import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { asset, ASSET } from './assets';

interface Props {
  children: ReactNode;
  /** 뒤로 가기 대상. 지정하면 헤더에 ← 버튼 */
  back?: { to: string; label?: string } | 'history';
  wide?: boolean;
  /** 홈처럼 본문에 큰 로고가 있을 때 헤더 로고 이미지를 생략 */
  hideLogoImage?: boolean;
}

export function AppLayout({ children, back, wide, hideLogoImage }: Props) {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id="pencil-grain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.5" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
      </svg>
      <a className="skip-link" href="#main">본문으로 건너뛰기</a>
      <header className="app-header">
        <div className="app-header__inner">
          {back === 'history' ? (
            <button type="button" className="app-header__back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
              <span aria-hidden="true">←</span> 뒤로
            </button>
          ) : back ? (
            <Link className="app-header__back" to={back.to}>
              <span aria-hidden="true">←</span> {back.label ?? '뒤로'}
            </Link>
          ) : null}
          <Link to="/" className="app-header__logo" aria-label="밥수증 홈으로">
            {!hideLogoImage && <img src={asset(ASSET.logo)} alt="" aria-hidden="true" width={40} height={40} />}
            <span>밥수증</span>
          </Link>
        </div>
      </header>
      <main id="main" className={`app-main${wide ? ' app-main--wide' : ''}`}>
        {children}
      </main>
      <footer className="app-footer">
        밥수증 | mealipt. · 기록은 이 브라우저에만 저장돼요 · 실제 영업/가격/알레르기 정보는 보장하지 않아요
      </footer>
    </div>
  );
}
