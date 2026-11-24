import type { CreateId } from '@/types';

function randomHex(bytes: number): string {
  try {
    const c = globalThis.crypto;
    if (c && typeof c.getRandomValues === 'function') {
      const arr = new Uint8Array(bytes);
      c.getRandomValues(arr);
      return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* fallthrough */
  }
  let s = '';
  for (let i = 0; i < bytes; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return s;
}

/** 예: 'rc-3f9a1c7e5b2d4a60' (64자 이하). crypto.randomUUID 기반, 없으면 fallback. */
export const createId: CreateId = (prefix = 'id') => {
  let uuid = '';
  try {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') uuid = c.randomUUID().replace(/-/g, '').slice(0, 16);
  } catch {
    /* fallthrough */
  }
  if (!uuid) uuid = randomHex(8);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'id';
  return `${safePrefix}-${uuid}`;
};
