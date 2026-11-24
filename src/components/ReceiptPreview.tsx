import {
  CATEGORY_LABEL,
  DINING_MODE_LABEL,
  FLAVOR_LABEL,
  FULLNESS_LABEL,
  INGREDIENT_LABEL,
  REJECTION_LABEL,
  type Receipt,
  type ShareProfile,
} from '@/types';
import { getMenuById } from '@/data/catalog';
import { formatDate, menuPriceById, receiptNo } from './receiptUtil';

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

const list = (xs: string[], empty = '상관없음') => (xs.length ? xs.join(', ') : empty);

function ProfileLines({ p }: { p: ShareProfile }) {
  return (
    <dl className="receipt__lines">
      {p.name && <Line k="닉네임" v={p.name} />}
      <Line k="식사 방식" v={DINING_MODE_LABEL[p.diningMode]} />
      <Line k="예산" v={p.budget === null ? '상관없음' : `${p.budget.toLocaleString('ko-KR')}원 이하`} />
      <Line k="포만감" v={p.fullness === null ? '상관없음' : FULLNESS_LABEL[p.fullness]} />
      <Line k="종류" v={list(p.preferredCategories.map((c) => CATEGORY_LABEL[c]))} />
      <Line k="맛" v={list(p.preferredFlavors.map((f) => FLAVOR_LABEL[f]))} />
      <Line k="제외 재료" v={list(p.avoidIngredients.map((i) => INGREDIENT_LABEL[i]), '없음')} />
      <Line k="제외 메뉴" v={list(p.avoidMenus.map((id) => getMenuById(id)?.name ?? id), '없음')} />
    </dl>
  );
}

/** 영수증 모양 미리보기 (톱니 가장자리, 모노 숫자). 최종/취향 밥수증 공통. */
export function ReceiptPreview({ receipt }: { receipt: Receipt }) {
  const round = receipt.receiptType === 'final' ? receipt.round : 0;
  const no = receipt.receiptType === 'final' ? receiptNo(receipt.id, round) : `#${receiptNo(receipt.id, 0).slice(1, 5)}-P`;
  const isFinal = receipt.receiptType === 'final';
  const price = isFinal ? menuPriceById(receipt.selectedMenuId) : null;

  return (
    <div className="receipt-wrap">
      <div className="receipt-shadow">
        <article className="receipt" aria-label={isFinal ? `${receipt.selectedMenuName} 밥수증` : '취향 밥수증'}>
          <p className="receipt__brand">밥수증</p>
          <p className="receipt__sub">mealipt. · {isFinal ? (receipt.mode === 'solo' ? '혼자 먹기' : '함께 먹기') : '취향 밥수증'}</p>
          <div className="receipt__no">
            <span>NO. {no}</span>
            <span>{formatDate(receipt.createdAt)}</span>
          </div>
          <hr />
          {isFinal ? (
            <>
              <p className="receipt__menu">{receipt.selectedMenuName}</p>
              <hr />
              <dl className="receipt__lines">
                <Line k="종류" v={CATEGORY_LABEL[receipt.selectedCategory]} />
                {price && <Line k="예상 가격" v={`${price} / 1인`} />}
                <Line k="일치 점수" v={`${receipt.score}점`} />
                <Line k="추천 라운드" v={`${receipt.round}회차`} />
                <Line k="인원" v={`${receipt.participantCount}명`} />
                {receipt.groupLabel && <Line k="모임" v={receipt.groupLabel} />}
                <Line k="거절 이유" v={list(receipt.rejectedReasonCodes.map((c) => REJECTION_LABEL[c]), '없음')} />
              </dl>
            </>
          ) : (
            <ProfileLines p={receipt.profile} />
          )}
          <hr />
          <p className="receipt__thanks">{isFinal ? '맛있게 드세요' : 'THANK YOU'}</p>
          <div className="receipt__barcode" aria-hidden="true" />
          <p className="receipt__foot">
            메뉴 결정 기록이에요. 실제 영업·가격·알레르기 정보는 보장하지 않아요.
          </p>
        </article>
      </div>
    </div>
  );
}
