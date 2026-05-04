import { describe, it, expect } from 'vitest';
import { getRelativeDate } from '../relativeDate';

const FIXED_NOW = new Date('2026-05-04T00:00:00Z').getTime();

describe('getRelativeDate', () => {
  it('returns "오늘" for a date today (ko)', () => {
    const date = new Date('2026-05-04T08:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('오늘');
  });

  it('returns "today" for a date today (en)', () => {
    const date = new Date('2026-05-04T08:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('today');
  });

  it('returns "1일 전" exactly 1 day ago (ko)', () => {
    const date = new Date('2026-05-03T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('1일 전');
  });

  it('returns "1 day ago" exactly 1 day ago (en)', () => {
    const date = new Date('2026-05-03T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('1 day ago');
  });

  it('returns "6일 전" within the same week (ko)', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('6일 전');
  });

  it('returns weeks for 7 to 29 days ago (ko)', () => {
    const date = new Date('2026-04-20T00:00:00Z'); // 14 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('2주 전');
  });

  it('returns weeks for 7 to 29 days ago (en)', () => {
    const date = new Date('2026-04-20T00:00:00Z'); // 14 days ago
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('2 weeks ago');
  });

  it('returns "1 week ago" exactly 7 days ago (en)', () => {
    const date = new Date('2026-04-27T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('1 week ago');
  });

  it('returns "1 month ago" exactly 30 days ago (en)', () => {
    const date = new Date('2026-04-04T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('1 month ago');
  });

  it('returns months for 30+ days ago (ko)', () => {
    const date = new Date('2026-02-04T00:00:00Z'); // ~89 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('3개월 전');
  });

  it('returns months for 30+ days ago (en)', () => {
    const date = new Date('2026-02-04T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('3 months ago');
  });

  it('returns null for dates older than 365 days', () => {
    const date = new Date('2025-04-01T00:00:00Z'); // ~398 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBeNull();
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBeNull();
  });

  it('returns null for future dates', () => {
    const date = new Date('2026-05-05T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBeNull();
  });
});
