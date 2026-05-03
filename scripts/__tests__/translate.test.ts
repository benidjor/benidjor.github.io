import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../translate.ts';

describe('detectLanguage', () => {
  it('should detect english text', () => {
    expect(detectLanguage('This is a simple English paragraph with enough words')).toBe('en');
  });

  it('should detect korean text', () => {
    expect(detectLanguage('안녕하세요 이것은 한국어 텍스트입니다 테스트를 위한 문장입니다')).toBe('ko');
  });

  it('should detect japanese text', () => {
    expect(detectLanguage('これは日本語のテキストです テストのための文章です')).toBe('ja');
  });

  it('should detect chinese text', () => {
    expect(detectLanguage('这是中文文本用于测试的句子这里有足够的内容来进行语言检测')).toBe('zh');
  });

  it('should return en for empty text', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('should strip code blocks before detection', () => {
    const content = `한국어 텍스트입니다
\`\`\`javascript
const x = 'english code';
console.log('hello world');
\`\`\`
한국어로 작성된 글입니다`;
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip inline code before detection', () => {
    const content = '한국어 `const x = 1` 설명 텍스트입니다 이것은 한국어 문장입니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip markdown links before detection', () => {
    const content = '한국어 [링크](https://example.com) 텍스트입니다 문장이 더 필요합니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip image embeds before detection', () => {
    const content = '한국어 ![[image.png]] 텍스트입니다 문장이 충분히 있어야 합니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip wikilinks before detection', () => {
    const content = '한국어 [[문서링크]] 텍스트입니다 더 많은 한국어 내용이 있습니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip heading markers before detection', () => {
    const content = '### 한국어 제목\n한국어 본문 내용이 여기에 있습니다 충분한 길이의 텍스트';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should strip URLs before detection', () => {
    const content = '한국어 텍스트 https://example.com/path 더 많은 한국어 텍스트입니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should handle mixed korean-english content with korean majority', () => {
    const content = '한국어로 작성된 React 프로젝트에 대한 블로그 글입니다 TypeScript를 사용합니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should detect english for code-heavy content with english descriptions', () => {
    const content = 'This is a tutorial about JavaScript programming with practical examples and code';
    expect(detectLanguage(content)).toBe('en');
  });

  it('should strip markdown formatting characters', () => {
    const content = '**한국어** *텍스트* ~~삭제선~~ 일반 텍스트 더 많은 한국어 내용이 필요합니다';
    expect(detectLanguage(content)).toBe('ko');
  });

  it('should handle whitespace-only content as english', () => {
    expect(detectLanguage('   \n\n   ')).toBe('en');
  });
});
