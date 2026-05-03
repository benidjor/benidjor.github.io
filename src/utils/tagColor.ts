function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  const hash = hashString(tag.toLowerCase());
  const hue = hash % 360;
  
  const lightModeBg = `hsl(${hue}, 75%, 85%)`;
  const lightModeText = `hsl(${hue}, 70%, 25%)`;
  const lightModeBorder = `hsl(${hue}, 70%, 40%)`;
  
  return {
    bg: lightModeBg,
    text: lightModeText,
    border: lightModeBorder,
  };
}

export function getTagStyle(tag: string): string {
  const colors = getTagColor(tag);
  return `background-color: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border};`;
}
