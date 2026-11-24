import { isStorageAvailable } from '@/lib/storage';

/** 저장소를 쓸 수 없을 때만 보이는 안내 배너 */
export function StorageBanner() {
  let ok = true;
  try {
    ok = isStorageAvailable();
  } catch {
    ok = false;
  }
  if (ok) return null;
  return (
    <p className="notice notice--error" role="status" style={{ marginBottom: 14 }}>
      이 브라우저에서는 저장이 안 돼요. 새로고침하면 입력이 사라지고 보관함에 남지 않아요.
    </p>
  );
}
