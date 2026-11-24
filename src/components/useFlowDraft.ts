import { useCallback, useState } from 'react';
import type { ActiveDraft, DraftFlow } from '@/types';
import { useDraft } from '@/hooks/useDraft';

/**
 * useDraft 래퍼. 로컬 state 로 즉시 반영하고 useDraft.setDraft 로 LocalStorage 에도 저장한다.
 * (저장소를 쓸 수 없어도 화면 흐름은 이어진다)
 */
export function useFlowDraft(flow: DraftFlow) {
  const { draft, setDraft, clear } = useDraft(flow);
  const [local, setLocal] = useState<ActiveDraft | null>(draft);

  const update = useCallback(
    (d: ActiveDraft) => {
      const next = { ...d, updatedAt: new Date().toISOString() };
      setLocal(next);
      setDraft(next);
    },
    [setDraft],
  );
  const reset = useCallback(() => {
    setLocal(null);
    clear();
  }, [clear]);

  return { draft: local, update, reset };
}
