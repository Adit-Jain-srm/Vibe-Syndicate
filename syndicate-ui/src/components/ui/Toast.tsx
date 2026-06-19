import { create } from 'zustand';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: ToastType, message: string, duration?: number) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  add: (type, message, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set(state => ({ toasts: [...state.toasts.slice(-4), { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().remove(id), duration);
    }
  },
  remove: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().add('success', msg),
  error: (msg: string) => useToastStore.getState().add('error', msg, 6000),
  warning: (msg: string) => useToastStore.getState().add('warning', msg, 5000),
  info: (msg: string) => useToastStore.getState().add('info', msg),
};

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald shrink-0" />,
  error: <XCircle size={16} className="text-rose shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber shrink-0" />,
  info: <Info size={16} className="text-accent shrink-0" />,
};

const BORDERS = {
  success: 'border-emerald/30',
  error: 'border-rose/30',
  warning: 'border-amber/30',
  info: 'border-accent/30',
};

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const remove = useToastStore(s => s.remove);

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#141517] backdrop-blur-xl border ${BORDERS[t.type]} shadow-lg max-w-sm cursor-pointer`}
            onClick={() => remove(t.id)}
          >
            {ICONS[t.type]}
            <span className="text-sm text-snow leading-snug">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
