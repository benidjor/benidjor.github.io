const DAY_MS = 24 * 60 * 60 * 1000;

type SupportedLocale = 'ko-KR' | 'en-US';

interface Phrases {
  today: string;
  daysAgo: (n: number) => string;
  weeksAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
}

const phrases: Record<SupportedLocale, Phrases> = {
  'ko-KR': {
    today: '오늘',
    daysAgo: (n) => `${n}일 전`,
    weeksAgo: (n) => `${n}주 전`,
    monthsAgo: (n) => `${n}개월 전`,
  },
  'en-US': {
    today: 'today',
    daysAgo: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
    weeksAgo: (n) => `${n} week${n === 1 ? '' : 's'} ago`,
    monthsAgo: (n) => `${n} month${n === 1 ? '' : 's'} ago`,
  },
};

function resolveLocale(locale: string): SupportedLocale {
  return locale === 'en-US' ? 'en-US' : 'ko-KR';
}

// Compare by UTC calendar day so a same-day future time still reads as "today".
function toUTCDay(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

export function getRelativeDate(date: Date, locale: string, now: number = Date.now()): string | null {
  const days = toUTCDay(now) - toUTCDay(date.getTime());
  if (days < 0 || days > 365) return null;

  const p = phrases[resolveLocale(locale)];
  if (days === 0) return p.today;
  if (days < 7) return p.daysAgo(days);
  if (days < 30) return p.weeksAgo(Math.floor(days / 7));
  return p.monthsAgo(Math.round(days / 30));
}
