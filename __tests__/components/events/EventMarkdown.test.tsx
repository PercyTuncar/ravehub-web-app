import { render, screen } from '@testing-library/react';
import { EventMarkdown } from '@/components/events/EventMarkdown';

describe('EventMarkdown', () => {
  it('renders basic markdown correctly', () => {
    const content = '**Bold** and *italic* text.';
    render(<EventMarkdown content={content} />);
    expect(screen.getByText(/Bold/)).toBeInTheDocument();
    expect(screen.getByText(/italic/)).toBeInTheDocument();
  });

  it('converts H1 to H2', () => {
    const content = '# Main Title';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('preserves H2 and lower headings', () => {
    const content = '## Section\n### Subsection';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.querySelectorAll('h2')).toHaveLength(1);
    expect(container.querySelectorAll('h3')).toHaveLength(1);
  });

  it('renders links with external attributes', () => {
    const content = '[External](https://example.com)';
    const { container } = render(<EventMarkdown content={content} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('renders lists correctly', () => {
    const content = '- Item 1\n- Item 2';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('does not render images', () => {
    const content = 'Text ![alt](image.jpg) more text.';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('skips raw HTML', () => {
    const content = 'Safe text <script>alert("xss")</script> more text.';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('renders GFM tables', () => {
    const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    const { container } = render(<EventMarkdown content={content} />);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('handles empty content', () => {
    const { container } = render(<EventMarkdown content="" />);
    expect(container.textContent).toBe('');
  });

  it('applies custom className', () => {
    const { container } = render(<EventMarkdown content="Text" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
