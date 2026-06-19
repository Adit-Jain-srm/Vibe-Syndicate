import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import { toast } from './Toast';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export default function CopyButton({ text, className = '', label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `Copied ${label}` : 'Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleCopy}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/5 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? (
        <Check size={12} className="text-emerald" />
      ) : (
        <Copy size={12} className="text-slate hover:text-fog transition-colors" />
      )}
    </motion.button>
  );
}
