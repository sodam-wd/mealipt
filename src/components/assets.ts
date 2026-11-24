/** public/assets PNG 경로 헬퍼. base='./' 이므로 BASE_URL 기준으로 만든다. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

export const ASSET = {
  logo: 'brand/logo-primary.png',
  solo: 'home/button-solo.png',
  share: 'home/button-share.png',
  archive: 'home/button-archive.png',
  clipboard: 'ui/order-sheet-clipboard.png',
  printer: 'ui/receipt-printer.png',
  stack: 'ui/receipt-stack.png',
  emptyPlate: 'status/empty-plate.png',
  mapPin: 'status/map-pin.png',
  stampBadges: 'status/stamp-badges.png',
} as const;
