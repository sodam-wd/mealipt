import LZString from 'lz-string';
import type {
  BuildShareUrl,
  DecodeErrorCode,
  DecodeResult,
  DecodeShareInput,
  EncodeSharePayload,
  SharePayload,
} from '@/types';
import { CATALOG_VERSION } from '@/data/catalog';
import { cleanText, LIMITS, parseFinalReceipt, parseShareProfile } from './validate';

export const SCHEMA_VERSION = 1;

/** 입력 전체 길이 상한(자). 이를 넘으면 해석을 시도하지 않는다. */
export const MAX_INPUT_LENGTH = 6000;
/** 압축 해제 후 JSON 문자열 상한(자). */
export const MAX_DECOMPRESSED_LENGTH = 32 * 1024;

export const DECODE_ERROR_MESSAGE: Record<DecodeErrorCode, string> = {
  empty: '링크를 붙여넣어 주세요.',
  not_mealipt: '밥수증 링크가 아니에요. 공유받은 링크 전체를 그대로 붙여넣어 주세요.',
  too_long: '링크가 너무 길어요. 밥수증에서 만든 링크가 맞는지 확인해 주세요.',
  corrupted: '링크가 중간에 잘렸거나 손상된 것 같아요. 메신저에서 링크를 다시 복사해 붙여넣어 주세요.',
  too_large: '링크에 담긴 내용이 너무 커서 열 수 없어요.',
  invalid_schema: '링크 내용이 올바르지 않아요. 밥수증에서 만든 링크가 맞는지 확인해 주세요.',
  unsupported_version: '다른 버전의 밥수증에서 만든 링크예요. 보낸 사람에게 최신 화면에서 다시 만들어 달라고 요청해 주세요.',
  catalog_mismatch: '메뉴 목록 버전이 달라서 이 취향 링크를 합칠 수 없어요. 보낸 사람에게 링크를 다시 만들어 달라고 요청해 주세요.',
};

const fail = (error: DecodeErrorCode): DecodeResult => ({ ok: false, error, message: DECODE_ERROR_MESSAGE[error] });

interface Envelope {
  k: 'p' | 'f';
  v: number;
  c: string;
  d: unknown;
}

/** 링크의 r 값만 만든다. */
export const encodeSharePayload: EncodeSharePayload = (payload) => {
  const envelope: Envelope =
    payload.kind === 'profile'
      ? {
          k: 'p',
          v: SCHEMA_VERSION,
          c: CATALOG_VERSION,
          d: { kind: 'profile', profile: payload.profile, ...(payload.groupLabel ? { groupLabel: payload.groupLabel } : {}) },
        }
      : { k: 'f', v: SCHEMA_VERSION, c: CATALOG_VERSION, d: { kind: 'final', receipt: payload.receipt } };
  // '+' 는 URLSearchParams 가 공백으로 바꾸므로 URL 안전 문자 '_' 로 치환한다(decode 에서 복원).
  return LZString.compressToEncodedURIComponent(JSON.stringify(envelope)).replace(/\+/g, '_');
};

export const buildShareUrl: BuildShareUrl = (payload) => {
  const loc = typeof location !== 'undefined' ? location : undefined;
  const base = loc ? `${loc.origin}${loc.pathname}` : '';
  return `${base}#/open?r=${encodeSharePayload(payload)}`;
};

// lz-string compressToEncodedURIComponent 알파벳: A-Z a-z 0-9 + - $
const R_PARAM = /[#?&/]r=([A-Za-z0-9+\-$%_]+)/;
// 공백은 URLSearchParams 가 '+' 를 디코드한 결과일 수 있다.
const BARE_VALUE = /^[A-Za-z0-9+\-$_ ]+$/;

/** 전체 URL, '#/open?r=..', r 값만, 메신저 텍스트 속 URL 에서 r 값을 뽑는다. */
function extractValue(input: string): string | null {
  const m = R_PARAM.exec(input);
  if (m) {
    let v = m[1];
    if (v.includes('%')) {
      try {
        v = decodeURIComponent(v);
      } catch {
        return null;
      }
    }
    return v.replace(/[_ ]/g, '+');
  }
  if (/^r=/.test(input)) {
    const rest = input.slice(2);
    return BARE_VALUE.test(rest) ? rest.replace(/[_ ]/g, '+') : null;
  }
  return BARE_VALUE.test(input) ? input.replace(/[_ ]/g, '+') : null;
}

export const decodeShareInput: DecodeShareInput = (input) => {
  if (typeof input !== 'string') return fail('empty');
  const text = input.trim();
  if (!text) return fail('empty');
  if (text.length > MAX_INPUT_LENGTH) return fail('too_long');

  const value = extractValue(text);
  if (!value) return fail('not_mealipt');

  let json: string | null;
  try {
    json = LZString.decompressFromEncodedURIComponent(value);
  } catch {
    return fail('corrupted');
  }
  if (!json) return fail('corrupted');
  if (json.length > MAX_DECOMPRESSED_LENGTH) return fail('too_large');

  let env: unknown;
  try {
    env = JSON.parse(json);
  } catch {
    return fail('corrupted');
  }
  if (typeof env !== 'object' || env === null || Array.isArray(env)) return fail('not_mealipt');
  const e = env as Record<string, unknown>;
  if (e.k !== 'p' && e.k !== 'f') return fail('invalid_schema');
  if (typeof e.v !== 'number') return fail('invalid_schema');
  if (e.v !== SCHEMA_VERSION) return fail('unsupported_version');
  if (typeof e.c !== 'string' || e.c.length === 0 || e.c.length > 32) return fail('invalid_schema');
  const d = e.d;
  if (typeof d !== 'object' || d === null || Array.isArray(d)) return fail('invalid_schema');
  const body = d as Record<string, unknown>;

  if (e.k === 'p') {
    if (body.kind !== 'profile') return fail('invalid_schema');
    const profile = parseShareProfile(body.profile);
    if (!profile) return fail('invalid_schema');
    let groupLabel: string | undefined;
    if (body.groupLabel !== undefined) {
      if (typeof body.groupLabel !== 'string' || Array.from(body.groupLabel).length > LIMITS.groupLabel) {
        return fail('invalid_schema');
      }
      groupLabel = cleanText(body.groupLabel, LIMITS.groupLabel) || undefined;
    }
    // 제외 메뉴 id 가 카탈로그마다 다를 수 있으므로 profile 은 버전이 달라지면 거부한다.
    if (e.c !== CATALOG_VERSION) return fail('catalog_mismatch');
    const payload: SharePayload = groupLabel ? { kind: 'profile', profile, groupLabel } : { kind: 'profile', profile };
    return { ok: true, payload, schemaVersion: e.v, catalogVersion: e.c };
  }

  if (body.kind !== 'final') return fail('invalid_schema');
  const receipt = parseFinalReceipt(body.receipt);
  if (!receipt) return fail('invalid_schema');
  // final 은 selectedMenuName 스냅샷이 있으므로 카탈로그 버전이 달라도 허용한다.
  return { ok: true, payload: { kind: 'final', receipt }, schemaVersion: e.v, catalogVersion: e.c };
};
