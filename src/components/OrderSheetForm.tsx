import { useMemo, useState, type FormEvent } from 'react';
import {
  BUDGET_OPTIONS,
  CATEGORIES,
  CATEGORY_LABEL,
  DINING_MODES,
  DINING_MODE_LABEL,
  FLAVORS,
  FLAVOR_LABEL,
  FULLNESS_LABEL,
  INGREDIENTS,
  INGREDIENT_LABEL,
  type DiningMode,
  type Level3,
  type PreferenceSheet,
} from '@/types';
import { CATALOG, getMenuById } from '@/data/catalog';
import { PencilCheckbox } from './PencilCheckbox';

interface Props {
  sheet: PreferenceSheet;
  onChange: (next: PreferenceSheet) => void;
  onSubmit: () => void;
  submitLabel: string;
  /** 닉네임 입력 표시(함께 먹기 취향 밥수증) */
  showName?: boolean;
  /** 제출 버튼 위에 추가 안내 */
  footer?: React.ReactNode;
}

const MODE_OPTIONS: DiningMode[] = ['any', ...DINING_MODES];
const FULLNESS_OPTIONS: (Level3 | null)[] = [null, 1, 2, 3];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

const budgetLabel = (b: number | null) => (b === null ? '상관없음' : `${b.toLocaleString('ko-KR')}원 이하`);

export function OrderSheetForm({ sheet, onChange, onSubmit, submitLabel, showName, footer }: Props) {
  const [menuQuery, setMenuQuery] = useState('');
  const set = (patch: Partial<PreferenceSheet>) => onChange({ ...sheet, ...patch });

  const matches = useMemo(() => {
    const q = menuQuery.trim();
    if (!q) return [];
    return CATALOG.filter((m) => m.name.includes(q) && !sheet.avoidMenus.includes(m.id)).slice(0, 6);
  }, [menuQuery, sheet.avoidMenus]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="sheet" onSubmit={submit} aria-label="취향 주문서">
      <p className="legend">
        <span className="legend__item">
          <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 22 L16 31 L35 6" fill="none" stroke="#4a4440" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          연필로 체크하면 선택돼요
        </span>
        <span className="legend__item">
          <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10 L31 32 M31 9 L10 33" fill="none" stroke="#b23a28" strokeWidth="4" strokeLinecap="round" /></svg>
          ✕ 는 꼭 빼고 싶은 것
        </span>
        <span className="legend__item">아무것도 안 골라도 추천받을 수 있어요</span>
      </p>

      {showName && (
        <div className="field">
          <label className="field__legend" htmlFor="nickname">
            <span className="field__no">NAME</span> 닉네임 <span className="field__hint">선택 · 최대 12자</span>
          </label>
          <input
            id="nickname"
            className="input"
            maxLength={12}
            value={sheet.name ?? ''}
            placeholder="예: 토마토"
            autoComplete="off"
            onChange={(e) => set({ name: e.target.value.slice(0, 12) || undefined })}
          />
        </div>
      )}

      <fieldset className="field">
        <legend className="field__legend"><span className="field__no">01</span> 어떻게 먹을까요?</legend>
        <div className="choices">
          {MODE_OPTIONS.map((m) => (
            <PencilCheckbox key={m} variant="radio" name="diningMode" label={DINING_MODE_LABEL[m]} checked={sheet.diningMode === m} onChange={() => set({ diningMode: m })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__legend"><span className="field__no">02</span> 1인 예산 <span className="field__hint">최대 금액</span></legend>
        <div className="choices">
          {BUDGET_OPTIONS.map((b) => (
            <PencilCheckbox key={String(b)} variant="radio" name="budget" label={budgetLabel(b)} checked={sheet.budget === b} onChange={() => set({ budget: b })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__legend"><span className="field__no">03</span> 얼마나 먹을 수 있나요?</legend>
        <div className="choices">
          {FULLNESS_OPTIONS.map((f) => (
            <PencilCheckbox key={String(f)} variant="radio" name="fullness" label={f === null ? '상관없음' : FULLNESS_LABEL[f]} checked={sheet.fullness === f} onChange={() => set({ fullness: f })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__legend"><span className="field__no">04</span> 끌리는 종류 <span className="field__hint">여러 개 가능</span></legend>
        <div className="choices">
          {CATEGORIES.map((c) => (
            <PencilCheckbox key={c} label={CATEGORY_LABEL[c]} checked={sheet.preferredCategories.includes(c)} onChange={() => set({ preferredCategories: toggle(sheet.preferredCategories, c) })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__legend"><span className="field__no">05</span> 원하는 맛 <span className="field__hint">여러 개 가능</span></legend>
        <div className="choices">
          {FLAVORS.map((f) => (
            <PencilCheckbox key={f} label={FLAVOR_LABEL[f]} checked={sheet.preferredFlavors.includes(f)} onChange={() => set({ preferredFlavors: toggle(sheet.preferredFlavors, f) })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__legend">
          <span className="field__no">06</span> 빼주세요 <span className="field__badge">필수 제외</span>
        </legend>
        <p className="field__hint" style={{ marginBottom: 6 }}>체크한 재료가 들어간 메뉴는 추천에서 완전히 빠져요. 알레르기 정보는 직접 꼭 확인해 주세요.</p>
        <div className="choices">
          {INGREDIENTS.map((i) => (
            <PencilCheckbox key={i} variant="cross" label={INGREDIENT_LABEL[i]} checked={sheet.avoidIngredients.includes(i)} onChange={() => set({ avoidIngredients: toggle(sheet.avoidIngredients, i) })} />
          ))}
        </div>
      </fieldset>

      <details className="fold field">
        <summary>07 · 이 메뉴는 빼주세요 (선택)</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          <label className="sr-only" htmlFor="menu-search">제외할 메뉴 검색</label>
          <input id="menu-search" className="input" value={menuQuery} placeholder="메뉴 이름으로 검색 (예: 김치)" autoComplete="off" onChange={(e) => setMenuQuery(e.target.value)} />
          {matches.length > 0 && (
            <div className="chips" role="group" aria-label="검색 결과">
              {matches.map((m) => (
                <button key={m.id} type="button" className="chip-add" onClick={() => { set({ avoidMenus: [...sheet.avoidMenus, m.id] }); setMenuQuery(''); }}>
                  + {m.name}
                </button>
              ))}
            </div>
          )}
          {menuQuery.trim() && matches.length === 0 && <p className="muted small">일치하는 메뉴가 없어요.</p>}
          {sheet.avoidMenus.length > 0 && (
            <div className="chips" aria-label="제외한 메뉴">
              {sheet.avoidMenus.map((id) => (
                <span className="chip" key={id}>
                  {getMenuById(id)?.name ?? id}
                  <button type="button" className="chip__x" aria-label={`${getMenuById(id)?.name ?? id} 제외 취소`} onClick={() => set({ avoidMenus: sheet.avoidMenus.filter((x) => x !== id) })}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </details>

      {footer && <div className="field">{footer}</div>}

      <div className="field">
        <button type="submit" className="btn btn--primary btn--block">{submitLabel}</button>
      </div>
    </form>
  );
}
