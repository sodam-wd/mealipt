import { useCallback, useState } from 'react';
import type { ActiveDraft, DraftFlow } from '@/types';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage';

export interface UseDraft {
  draft: ActiveDraft | null; // 다른 flow 의 draft 이면 null
  setDraft: (d: ActiveDraft) => void; // 상태 + LocalStorage 동시 저장
  clear: () => void;
}

export function useDraft(flow: DraftFlow): UseDraft {
  const [stored, setStored] = useState<ActiveDraft | null>(() => loadDraft());

  const setDraft = useCallback((d: ActiveDraft) => {
    const next: ActiveDraft = { ...d, updatedAt: new Date().toISOString() };
    setStored(next);
    saveDraft(next); // 저장 실패(사생활 보호 모드 등)해도 화면 상태는 유지
  }, []);

  const clear = useCallback(() => {
    setStored(null);
    clearDraft();
  }, []);

  return { draft: stored && stored.flow === flow ? stored : null, setDraft, clear };
}
