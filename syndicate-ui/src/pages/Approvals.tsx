import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import AgentAvatar from '../components/AgentAvatar';
import { playSound } from '../lib/sounds';

interface ApprovalItem {
  id: string;
  task_id: string;
  type: string;
  agent: string;
  content: string;
  created_at: string;
}

export default function Approvals() {
  const [pending, setPending] = useState<ApprovalItem[]>([]);

  useEffect(() => {
    supabase.from('events')
      .select('*')
      .or('type.eq.review_failed,type.eq.hitl_pause')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setPending(data || []));
  }, []);

  const handleApprove = async (item: ApprovalItem) => {
    playSound('success');
    await supabase.from('events').insert({
      task_id: item.task_id,
      type: 'approval_granted',
      agent: 'human',
      content: `Approved: ${item.content.slice(0, 100)}`,
      metadata: { approved_event_id: item.id },
    });
    setPending(prev => prev.filter(p => p.id !== item.id));
  };

  const handleReject = async (item: ApprovalItem) => {
    playSound('error');
    await supabase.from('events').insert({
      task_id: item.task_id,
      type: 'approval_rejected',
      agent: 'human',
      content: `Rejected: ${item.content.slice(0, 100)}`,
      metadata: { rejected_event_id: item.id },
    });
    setPending(prev => prev.filter(p => p.id !== item.id));
  };

  return (
    <div className="min-h-screen p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Approvals
      </motion.h1>
      <p className="text-[var(--color-subtle)] mb-8">Human-in-the-loop — decisions that need your judgment</p>

      {pending.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-emerald)]/10 flex items-center justify-center">
            <span className="text-2xl">{'\u2713'}</span>
          </div>
          <p className="text-[var(--color-dim)]">No pending approvals</p>
          <p className="text-xs text-[var(--color-muted)] mt-2">High-risk decisions will appear here for your review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl border-l-4"
              style={{ borderLeftColor: item.type === 'review_failed' ? '#fb7185' : '#fbbf24' }}
            >
              <div className="flex items-start gap-4">
                <AgentAvatar role={item.agent} size={36} active />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium capitalize text-[var(--color-bright)]">{item.agent}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-rose)]/10 text-[var(--color-rose)] font-mono">{item.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-[var(--color-dim)] leading-relaxed">{item.content}</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-2 font-mono">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 ml-[52px]">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleApprove(item)}
                  className="px-4 py-2 bg-[var(--color-emerald)] text-white text-sm rounded-xl font-medium">
                  Approve
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleReject(item)}
                  className="px-4 py-2 bg-transparent border border-[var(--color-rose)]/50 text-[var(--color-rose)] text-sm rounded-xl font-medium">
                  Reject
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
