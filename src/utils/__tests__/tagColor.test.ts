import { describe, it, expect } from 'vitest';
import { getTagColor, getTagStyle } from '../tagColor';

describe('getTagColor', () => {
  it('should return bg, text, and border color properties', () => {
    const result = getTagColor('typescript');
    expect(result).toHaveProperty('bg');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('border');
  });

  it('should return valid HSL color strings', () => {
    const result = getTagColor('react');
    expect(result.bg).toMatch(/^hsl\(\d+, 75%, 85%\)$/);
    expect(result.text).toMatch(/^hsl\(\d+, 70%, 25%\)$/);
    expect(result.border).toMatch(/^hsl\(\d+, 70%, 40%\)$/);
  });

  it('should return same color for same tag', () => {
    const first = getTagColor('javascript');
    const second = getTagColor('javascript');
    expect(first).toEqual(second);
  });

  it('should be case-insensitive', () => {
    const lower = getTagColor('react');
    const upper = getTagColor('React');
    const mixed = getTagColor('REACT');
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
  });

  it('should return different colors for different tags', () => {
    const tag1 = getTagColor('typescript');
    const tag2 = getTagColor('python');
    expect(tag1.bg).not.toBe(tag2.bg);
  });

  it('should handle empty string', () => {
    const result = getTagColor('');
    expect(result.bg).toMatch(/^hsl\(\d+, 75%, 85%\)$/);
  });

  it('should handle korean tags', () => {
    const result = getTagColor('프로그래밍');
    expect(result.bg).toMatch(/^hsl\(\d+, 75%, 85%\)$/);
  });

  it('should handle special characters in tags', () => {
    const result = getTagColor('c++');
    expect(result.bg).toMatch(/^hsl\(\d+, 75%, 85%\)$/);
  });

  it('should produce hue values within 0-359 range', () => {
    const tags = ['a', 'bb', 'ccc', 'long-tag-name', '한글태그'];
    for (const tag of tags) {
      const result = getTagColor(tag);
      const hueMatch = result.bg.match(/^hsl\((\d+),/);
      expect(hueMatch).not.toBeNull();
      const hue = parseInt(hueMatch![1], 10);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});

describe('getTagStyle', () => {
  it('should return a valid CSS style string', () => {
    const style = getTagStyle('typescript');
    expect(style).toContain('background-color:');
    expect(style).toContain('color:');
    expect(style).toContain('border-color:');
  });

  it('should contain HSL values from getTagColor', () => {
    const colors = getTagColor('react');
    const style = getTagStyle('react');
    expect(style).toContain(colors.bg);
    expect(style).toContain(colors.text);
    expect(style).toContain(colors.border);
  });

  it('should return consistent results for same tag', () => {
    expect(getTagStyle('astro')).toBe(getTagStyle('astro'));
  });

  it('should format as semicolon-separated CSS properties', () => {
    const style = getTagStyle('test');
    const parts = style.split(';').filter(s => s.trim());
    expect(parts).toHaveLength(3);
  });
});
