import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SearchResult {
  type: 'task' | 'event' | 'memory';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

const PAGES = [
  { label: 'Dashboard', path: '/app' },
  { label: 'Pipeline', path: '/pipeline' },
  { label: 'Live Room', path: '/live' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Metrics', path: '/metrics' },
  { label: 'Memory', path: '/memory' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Agents', path: '/agents' },
  { label: 'Traces', path: '/traces' },
  { label: 'Controls', path: '/controls' },
  { label: 'Docs', path: '/docs' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const r: SearchResult[] = [];

      const [tasks, events, memories] = await Promise.all([
        supabase.from('tasks').select('id,description,status').ilike('description', `%${query}%`).limit(5),
        supabase.from('events').select('id,type,agent,content').ilike('content', `%${query}%`).limit(5),
        supabase.from('memory').select('id,content,category').ilike('content', `%${query}%`).limit(5),
      ]);

      (tasks.data || []).forEach(t => r.push({ type: 'task', id: t.id, title: t.description.slice(0, 60), subtitle: t.status, link: `/tasks/${t.id}` }));
      (events.data || []).forEach(e => r.push({ type: 'event', id: e.id, title: e.content.slice(0, 60), subtitle: `${e.agent} • ${e.type}`, link: '/traces' }));
      (memories.data || []).forEach(m => r.push({ type: 'memory', id: m.id, title: m.content.slice(0, 60), subtitle: m.category, link: '/memory' }));

      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const pageResults = query.trim()
    ? PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  const handleSelect = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-start justify-center pt-[20vh]"
        onClick={() => setOpen(false)}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md mx-4 bg-[#141517] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Search size={16} className="text-slate shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks, events, memories… or navigate"
              className="flex-1 bg-transparent text-sm text-snow placeholder-slate focus:outline-none"
            />
            <kbd className="text-[9px] text-slate border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2">
            {/* Page navigation */}
            {pageResults.length > 0 && !results.length && (
              <div className="px-2">
                <p className="px-2 py-1 text-[9px] text-slate uppercase tracking-wide">Pages</p>
                {pageResults.slice(0, 6).map(p => (
                  <button
                    key={p.path}
                    onClick={() => handleSelect(p.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-fog hover:bg-white/5 transition-colors"
                  >
                    {p.label}
                    <ArrowRight size={12} className="text-slate" />
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div className="px-2">
                {results.map(r => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.link)}
                    className="w-full flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5 ${
                      r.type === 'task' ? 'bg-accent/10 text-accent' :
                      r.type === 'event' ? 'bg-emerald/10 text-emerald' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>{r.type}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-fog truncate">{r.title}</p>
                      <p className="text-[10px] text-slate">{r.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <p className="text-center text-xs text-slate py-4">Searching…</p>
            )}

            {query.length >= 2 && !loading && results.length === 0 && pageResults.length === 0 && (
              <p className="text-center text-xs text-slate py-4">No results</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
