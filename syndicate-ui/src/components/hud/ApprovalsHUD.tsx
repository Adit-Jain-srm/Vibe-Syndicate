import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { playSound } from '../../lib/sounds';
import type { Approval } from '../../lib/api';

export default function ApprovalsHUD() {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    api.getApprovals().then(setApprovals).catch(() => {});
    const ch = supabase.channel('hud-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => {
        api.getApprovals().then(setApprovals);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pending = approvals.filter(a => a.status === 'pending');

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    await api.resolveApproval(id, decision);
    playSound(decision === 'approved' ? 'success' : 'error');
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 w-[480px] max-h-[60vh]"
    >
      <div className="rounded-3xl bg-[rgba(8,9,12,0.82)] backdrop-blur-2xl border border-[#fb7185]/20 p-6 shadow-[0_0_40px_rgba(251,113,133,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" />
          <h2 className="text-sm font-medium text-white">
            {pending.length > 0 ? `${pending.length} pending decision${pending.length > 1 ? 's' : ''}` : 'No pending approvals'}
          </h2>
        </div>

        {pending.length === 0 ? (
          <p className="text-xs text-[#6b7280] text-center py-6">The system flows freely. No human intervention needed.</p>
        ) : (
          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            <AnimatePresence>
              {pending.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{
                      background: item.risk_level === 'critical' ? '#ef444420' : item.risk_level === 'high' ? '#fb718520' : '#fbbf2420',
                      color: item.risk_level === 'critical' ? '#fca5a5' : item.risk_level === 'high' ? '#fda4af' : '#fde68a',
                    }}>
                      {item.risk_level}
                    </span>
                    <span className="text-[10px] text-[#6b7280] capitalize">{item.agent}</span>
                  </div>
                  <p className="text-xs text-[#d1d5db] mb-3 line-clamp-2">{item.title}</p>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDecision(item.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#34d399]/10 text-[#34d399] text-xs rounded-lg border border-[#34d399]/20 hover:bg-[#34d399]/20 transition-colors">
                      <CheckCircle size={12} /> Approve
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDecision(item.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#fb7185]/10 text-[#fb7185] text-xs rounded-lg border border-[#fb7185]/20 hover:bg-[#fb7185]/20 transition-colors">
                      <XCircle size={12} /> Reject
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
