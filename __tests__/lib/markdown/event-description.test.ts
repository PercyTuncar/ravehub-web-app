import { markdownToPlainText, truncateMarkdownText, normalizeEventDescriptionMarkdown } from '@/lib/markdown/event-description';

describe('markdownToPlainText', () => {
  it('converts basic markdown to plain text', () => {
    const input = '**bold** and *italic* text';
    expect(markdownToPlainText(input)).toBe('bold and italic text');
  });

  it('converts headings to plain text', () => {
    const input = '## Heading 2\n### Heading 3';
    expect(markdownToPlainText(input)).toBe('Heading 2\nHeading 3');
  });

  it('converts links to their text', () => {
    const input = 'Visit [our site](https://example.com) for more.';
    expect(markdownToPlainText(input)).toBe('Visit our site for more.');
  });

  it('removes images', () => {
    const input = 'Check ![alt text](image.jpg) this out.';
    expect(markdownToPlainText(input)).toBe('Check alt text this out.');
  });

  it('converts lists to plain text', () => {
    const input = '- Item 1\n- Item 2\n1. First\n2. Second';
    expect(markdownToPlainText(input)).toBe('Item 1\nItem 2\nFirst\nSecond');
  });

  it('converts code blocks to plain text', () => {
    const input = '```js\nconst x = 1;\n```\nand `inline code`';
    expect(markdownToPlainText(input)).toBe('const x = 1;\nand inline code');
  });

  it('handles empty or null input', () => {
    expect(markdownToPlainText('')).toBe('');
    expect(markdownToPlainText(null)).toBe('');
    expect(markdownToPlainText(undefined)).toBe('');
  });

  it('normalizes excessive whitespace', () => {
    const input = 'Line 1\n\n\n\nLine 2    with    spaces';
    expect(markdownToPlainText(input)).toBe('Line 1\n\nLine 2 with spaces');
  });

  it('preserves plain text without markdown', () => {
    const input = 'Plain text event description with no markdown.';
    expect(markdownToPlainText(input)).toBe(input);
  });
});

describe('truncateMarkdownText', () => {
  it('truncates long text at specified length', () => {
    const input = 'a'.repeat(400);
    const result = truncateMarkdownText(input, 300);
    expect(result.length).toBeLessThanOrEqual(300);
    expect(result.endsWith('…')).toBe(true);
  });

  it('does not truncate short text', () => {
    const input = 'Short description.';
    expect(truncateMarkdownText(input, 300)).toBe(input);
  });

  it('handles markdown before truncating', () => {
    const input = '**Bold** ' + 'text '.repeat(100);
    const result = truncateMarkdownText(input, 50);
    expect(result).not.toContain('**');
    expect(result.length).toBeLessThanOrEqual(50);
  });
});

describe('normalizeEventDescriptionMarkdown', () => {
  it('converts leading H1 to H2', () => {
    const input = '# Main Heading\nContent here.';
    expect(normalizeEventDescriptionMarkdown(input)).toBe('## Main Heading\nContent here.');
  });

  it('converts multiple H1s to H2s', () => {
    const input = '# First\nSome text.\n# Second';
    expect(normalizeEventDescriptionMarkdown(input)).toBe('## First\nSome text.\n## Second');
  });

  it('preserves H2 and lower headings', () => {
    const input = '## H2\n### H3\n#### H4';
    expect(normalizeEventDescriptionMarkdown(input)).toBe(input);
  });

  it('does not affect inline # symbols', () => {
    const input = 'Use #hashtag in text.';
    expect(normalizeEventDescriptionMarkdown(input)).toBe(input);
  });

  it('handles empty input', () => {
    expect(normalizeEventDescriptionMarkdown('')).toBe('');
    expect(normalizeEventDescriptionMarkdown(null)).toBe('');
    expect(normalizeEventDescriptionMarkdown(undefined)).toBe('');
  });

  it('handles whitespace around H1', () => {
    const input = '  #   Heading with spaces';
    expect(normalizeEventDescriptionMarkdown(input)).toBe('  ##   Heading with spaces');
  });
});
