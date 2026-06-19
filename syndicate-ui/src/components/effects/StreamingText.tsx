import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function StreamingText({ text, speed = 15, onComplete, className = '' }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    let idx = 0;
    setDisplayed('');
    setDone(false);

    const timer = setInterval(() => {
      idx++;
      if (idx >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, idx));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  );
}
