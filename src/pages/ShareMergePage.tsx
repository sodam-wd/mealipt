import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorageBanner } from '@/components/StorageBanner';
import { AppLayout } from '@/components/AppLayout';
import { DecoImg } from '@/components/DecoImg';
import { ASSET } from '@/components/assets';
import { emptyContext, recentMenuIdsFrom } from '@/components/receiptUtil';
import { useFlowDraft } from '@/components/useFlowDraft';
import { MAX_MERGE, MIN_MERGE, addProfile } from '@/features/share';
import { useReceipts } from '@/hooks/useReceipts';
import { decodeShareInput } from '@/lib/codec';
import { listGroups, saveGroup } from '@/lib/storage';
import type { ShareProfile } from '@/types';

const chipName = (p: ShareProfile, i: number) => p.name || `참가자 ${i + 1}`;

export function ShareMergePage() {
  const navigate = useNavigate();
  const { draft, update } = useFlowDraft('share-merge');
  const { receipts } = useReceipts();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const profiles = draft?.profiles ?? [];
  const groupLabel = draft?.groupLabel ?? '';
  const groups = useMemo(() => {
    try {
      return listGroups();
    } catch {
      return [];
    }
  }, []);
  const myProfiles = receipts.filter((r) => r.receiptType === 'profile');

  const write = (next: ShareProfile[], label = groupLabel) =>
    update({
      flow: 'share-merge',
      step: 'form',
      profiles: next,
      groupLabel: label || undefined,
      context: draft?.context ?? emptyContext(),
      round: draft?.round ?? 1,
      updatedAt: '',
    });

  const add = (p: ShareProfile) => {
    const r = addProfile(profiles, p);
    if (!r.ok) {
      setError(r.message);
      setInfo(null);
      return false;
    }
    write(r.profiles);
    setError(null);
    return true;
  };

  const addFromInput = () => {
    setInfo(null);
    const res = decodeShareInput(input);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (res.payload.kind !== 'profile') {
      setError('이 링크는 최종 밥수증이에요. 합치기에는 "취향 밥수증" 링크만 추가할 수 있어요.');
      return;
    }
    const { profile, groupLabel: gl } = res.payload;
    if (add(profile)) {
      setInput('');
      setInfo(`${profile.name || '참가자'}의 취향 밥수증을 추가했어요.`);
      if (gl && !groupLabel) write([...profiles, profile], gl);
    }
  };

  const remove = (id: string) => write(profiles.filter((p) => p.id !== id));

  const canMerge = profiles.length >= MIN_MERGE && profiles.length <= MAX_MERGE;

  const merge = () => {
    const label = groupLabel.trim();
    if (label) saveGroup(label);
    update({
      flow: 'share-merge',
      step: 'result',
      profiles,
      groupLabel: label || undefined,
      context: emptyContext(recentMenuIdsFrom(receipts)),
      round: 1,
      updatedAt: '',
    });
    navigate('/share/result');
  };

  return (
    <AppLayout back={{ to: '/share', label: '함께 먹기' }}>
      <div className="page-head">
        <DecoImg className="page-head__art" src={ASSET.stack} size={84} />
        <div>
          <h1 className="page-title">밥수증 합치기</h1>
          <p className="page-lead">친구들의 취향 밥수증 링크를 모아 주세요. ({MIN_MERGE}~{MAX_MERGE}장)</p>
        </div>
      </div>

      <StorageBanner />
      <div className="stack-lg">
        <section className="dropzone stack" aria-labelledby="paste-title">
          <h2 className="section-title" id="paste-title">링크 붙여넣기</h2>
          <div>
            <label className="label" htmlFor="link-input">받은 링크</label>
            <textarea
              id="link-input"
              className="input"
              value={input}
              placeholder="메신저로 받은 밥수증 링크를 붙여넣으세요"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addFromInput();
              }}
            />
          </div>
          <button type="button" className="btn btn--olive" onClick={addFromInput} disabled={!input.trim()}>이 밥수증 추가</button>
          <div role="status" aria-live="polite">
            {error && <p className="notice notice--error">{error}</p>}
            {info && !error && <p className="notice notice--ok">{info}</p>}
          </div>
        </section>

        {myProfiles.length > 0 && (
          <section aria-labelledby="mine-title">
            <h2 className="section-title" id="mine-title">내가 발행한 취향 밥수증</h2>
            <div className="chips">
              {myProfiles.map((r) =>
                r.receiptType === 'profile' ? (
                  <button
                    key={r.id}
                    type="button"
                    className="chip-add"
                    disabled={profiles.some((p) => p.id === r.profile.id)}
                    onClick={() => add(r.profile)}
                  >
                    + {r.profile.name || '내 취향'}
                  </button>
                ) : null,
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="list-title">
          <h2 className="section-title" id="list-title">추가된 밥수증 {profiles.length}장</h2>
          {profiles.length === 0 ? (
            <p className="muted">아직 없어요. 링크를 붙여넣어 시작해 보세요.</p>
          ) : (
            <ul className="chips" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {profiles.map((p, i) => (
                <li className="chip" key={p.id}>
                  {chipName(p, i)}
                  <button type="button" className="chip__x" aria-label={`${chipName(p, i)} 밥수증 빼기`} onClick={() => remove(p.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
          {profiles.length < MIN_MERGE && profiles.length > 0 && (
            <p className="muted small" style={{ marginTop: 8 }}>{MIN_MERGE - profiles.length}장 더 추가하면 합칠 수 있어요.</p>
          )}
        </section>

        <section>
          <label className="label" htmlFor="group-label">모임 이름 (선택)</label>
          <input
            id="group-label"
            className="input"
            list="group-list"
            maxLength={16}
            value={groupLabel}
            placeholder="예: 대학친구, 가족"
            autoComplete="off"
            onChange={(e) => write(profiles, e.target.value.slice(0, 16))}
          />
          <datalist id="group-list">
            {groups.map((g) => <option key={g} value={g} />)}
          </datalist>
          <p className="muted small" style={{ marginTop: 4 }}>보관함에서 모임별로 모아볼 수 있어요.</p>
        </section>

        <div className="stack">
          <button type="button" className="btn btn--primary btn--block" disabled={!canMerge} onClick={merge}>
            합쳐서 추천받기
          </button>
          <p className="muted small">
            링크 속 내용은 암호화되지 않아요. 합친 결과는 이 기기에서만 계산되고, 다른 사람과 자동으로 동기화되지 않아요.{' '}
            <Link to="/share/create">내 취향 밥수증 만들기</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
