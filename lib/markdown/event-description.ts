const MARKDOWN_SYNTAX_PATTERN = /(^|\s)(#{1,6})\s+|([*_~`])|!?\[([^\]]*)\]\([^)]*\)|^\s*[-+*]\s+|^\s*\d+[.)]\s+|^\s*>\s?|\|/gm;

/** Converts event Markdown into readable text for SEO and collapsed previews. */
export function markdownToPlainText(markdown: string | null | undefined): string {
  if (!markdown) return '';

  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[^\n]*\n?|```$/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(MARKDOWN_SYNTAX_PATTERN, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

export function truncateMarkdownText(markdown: string | null | undefined, maxLength = 300): string {
  const plainText = markdownToPlainText(markdown);
  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Removes a leading Markdown H1 marker while preserving its text as an H2. */
export function normalizeEventDescriptionMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return '';
  return markdown.replace(/^(\s*)#(?!#)(\s+)/gm, '$1##$2');
}
