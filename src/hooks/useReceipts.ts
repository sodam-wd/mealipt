import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Receipt, Stats, StorageResult } from '@/types';
import { computeStats } from '@/features/archive';
import { clearAllData, deleteReceipt, isStorageAvailable, listReceipts, saveReceipt } from '@/lib/storage';

export interface UseReceipts {
  receipts: Receipt[];
  stats: Stats;
  save: (r: Receipt) => StorageResult;
  remove: (id: string) => StorageResult;
  clearAll: () => StorageResult;
  storageAvailable: boolean;
}

export function useReceipts(): UseReceipts {
  const [receipts, setReceipts] = useState<Receipt[]>(() => listReceipts());
  const [storageAvailable] = useState<boolean>(() => isStorageAvailable());

  const refresh = useCallback(() => setReceipts(listReceipts()), []);

  // 다른 탭에서 변경된 mealipt.* 반영
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('mealipt.')) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const save = useCallback(
    (r: Receipt) => {
      const res = saveReceipt(r);
      if (res.ok) refresh();
      return res;
    },
    [refresh],
  );
  const remove = useCallback(
    (id: string) => {
      const res = deleteReceipt(id);
      if (res.ok) refresh();
      return res;
    },
    [refresh],
  );
  const clearAll = useCallback(() => {
    const res = clearAllData();
    if (res.ok) refresh();
    return res;
  }, [refresh]);

  const stats = useMemo(() => computeStats(receipts), [receipts]);
  return { receipts, stats, save, remove, clearAll, storageAvailable };
}
