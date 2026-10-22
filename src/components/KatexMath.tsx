import React, { useMemo } from 'react';
import katex from 'katex';

interface KatexMathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KatexMath: React.FC<KatexMathProps> = ({
  math,
  block = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return `<span class="text-rose-500 font-mono text-xs">${math}</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`my-1.5 overflow-x-auto py-1 text-slate-800 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-middle mx-0.5 text-slate-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default KatexMath;
