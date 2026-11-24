import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { DecoImg } from '@/components/DecoImg';
import { ASSET } from '@/components/assets';

export function ShareHubPage() {
  return (
    <AppLayout back={{ to: '/' }}>
      <div className="page-head">
        <DecoImg className="page-head__art" src={ASSET.stack} size={84} />
        <div>
          <h1 className="page-title">함께 먹기</h1>
          <p className="page-lead">각자 취향 밥수증을 만들고, 한 명이 합쳐요.</p>
        </div>
      </div>

      <section className="sheet sheet--plain stack" aria-labelledby="how">
        <h2 className="section-title" id="how">이렇게 진행돼요</h2>
        <ol className="steps">
          <li>각자 자기 폰에서 <strong>내 취향 밥수증</strong>을 발행해요.</li>
          <li>발행된 링크를 메신저로 공유해요.</li>
          <li>한 사람이 링크들을 모아 <strong>밥수증 합치기</strong>를 해요. (2~10장)</li>
          <li>공동 추천을 보고, 대화로 합의한 뒤 결정자가 기록해요.</li>
        </ol>
      </section>

      <div className="stack" style={{ marginTop: 20 }}>
        <Link className="btn btn--primary btn--block" to="/share/create">내 취향 밥수증 만들기</Link>
        <Link className="btn btn--block" to="/share/merge">밥수증 합치기</Link>
      </div>

      <p className="notice" style={{ marginTop: 20 }}>
        링크는 암호화가 아니며 링크를 가진 사람은 내용을 볼 수 있어요. 사용자 간 자동 동기화는 되지 않아요. 공동 결과에서는 개인별 점수와 이유를 보여주지 않아요.
      </p>
    </AppLayout>
  );
}
