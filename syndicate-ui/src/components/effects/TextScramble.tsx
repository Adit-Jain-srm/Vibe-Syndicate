import { useRef, useCallback } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

interface TextScrambleProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function TextScramble({ text, className = '', as: Tag = 'span' }: TextScrambleProps) {
  const ref = useRef<HTMLElement>(null);
  const intervalRef = useRef<number | null>(null);

  const scramble = useCallback(() => {
    if (!ref.current) return;
    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      if (!ref.current) return;
      ref.current.textContent = text
        .split('')
        .map((char, i) => {
          if (i < iteration) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      iteration += 1 / 2;
      if (iteration >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        if (ref.current) ref.current.textContent = text;
      }
    }, 30);
  }, [text]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (ref.current) ref.current.textContent = text;
  }, [text]);

  return (
    <Tag
      ref={ref as any}
      className={className}
      onMouseEnter={scramble}
      onMouseLeave={reset}
    >
      {text}
    </Tag>
  );
}
