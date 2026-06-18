import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Approval } from '../lib/api';
import AgentAvatar from '../components/AgentAvatar';
import { playSound } from '../lib/sounds';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const RISK_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  critical: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', text: '#fca5a5' },
  high: { border: '#fb7185', bg: 'rgba(251,113,133,0.08)', text: '#fda4af' },
  medium: { border: '#fbbf24', bg: 'rgba(251,191,36,0.08)', text: '#fde68a' },
  low: { border: '#34d399', bg: 'rgba(52,211,153,0.08)', text: '#6ee7b7' },
};

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApprovals()
      .then(setApprovals)
      .catch(() => {})
      .finally(() => setLoading(false));

    const ch = supabase
      .channel('approvals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => {
        api.getApprovals().then(setApprovals);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await api.resolveApproval(id, decision);
      playSound(decision === 'approved' ? 'success' : 'error');
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision, decided_at: new Date().toISOString(), decided_by: 'user' } : a));
    } catch {
      playSound('error');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1200px]">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">Approvals</h1>
          </div>
          <p className="text-sm text-slate mt-1">Human-in-the-loop — decisions that need your judgment</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Pending', value: pending.length, icon: Clock, color: '#fbbf24' },
            { label: 'Approved', value: resolved.filter(a => a.status === 'approved').length, icon: CheckCircle, color: '#34d399' },
            { label: 'Rejected', value: resolved.filter(a => a.status === 'rejected').length, icon: XCircle, color: '#fb7185' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-graphite/50 bg-charcoal/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={12} style={{ color: stat.color }} />
                <span className="text-[10px] text-fog uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-2xl font-light" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Pending Approvals */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : pending.length === 0 ? (
          <GlassPanel variant="subtle" className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald/10 flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald" />
            </div>
            <p className="text-sm text-fog">No pending approvals</p>
            <p className="text-xs text-slate mt-2">High-risk decisions will appear here for your review</p>
          </GlassPanel>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {pending.map((item, i) => {
                const risk = RISK_COLORS[item.risk_level] || RISK_COLORS.medium;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
                    className="rounded-2xl border-l-4 p-6"
                    style={{ borderLeftColor: risk.border, background: risk.bg }}
                  >
                    <div className="flex items-start gap-4">
                      <AgentAvatar role={item.agent} size={36} active />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium capitalize text-snow">{item.agent}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${risk.border}20`, color: risk.text }}>
                            {item.risk_level} risk
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">{item.type.replace(/_/g, ' ')}</span>
                        </div>
                        <h3 className="text-sm font-medium text-fog mb-1">{item.title}</h3>
                        <p className="text-xs text-slate leading-relaxed">{item.description}</p>
                        <p className="text-[10px] text-slate/60 mt-2 font-mono">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 ml-[52px]">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleDecision(item.id, 'approved')}
                        className="px-5 py-2 bg-emerald text-white text-sm rounded-xl font-medium flex items-center gap-1.5">
                        <CheckCircle size={14} /> Approve
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleDecision(item.id, 'rejected')}
                        className="px-5 py-2 bg-transparent border border-rose/50 text-rose text-sm rounded-xl font-medium flex items-center gap-1.5">
                        <XCircle size={14} /> Reject
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Resolved History */}
        {resolved.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10">
            <h2 className="text-sm font-medium text-fog uppercase tracking-wide mb-4">History</h2>
            <div className="space-y-2">
              {resolved.slice(0, 10).map((item, i) => (
                <motion.div key={item.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-charcoal/40 border border-graphite/30">
                  <AgentAvatar role={item.agent} size={24} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-fog truncate block">{item.title}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${item.status === 'approved' ? 'bg-emerald/10 text-emerald' : 'bg-rose/10 text-rose'}`}>
                    {item.status}
                  </span>
                  <span className="text-[10px] text-slate font-mono">{item.decided_at ? new Date(item.decided_at).toLocaleTimeString() : ''}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
