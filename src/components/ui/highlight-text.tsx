import { memo } from 'react';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightText = memo(function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query || query.length < 2) {
    return <span className={className}>{text}</span>;
  }

  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-800">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
});
