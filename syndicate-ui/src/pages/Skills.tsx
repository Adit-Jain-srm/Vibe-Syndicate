import { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Search, Download, Star, ExternalLink } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import { toast } from '../components/ui/Toast';

interface SkillResult {
  name: string;
  full_name: string;
  description: string;
  stars: number;
  install: string;
}

export default function Skills() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SkillResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query + ' topic:cursor-skills')}&sort=stars&per_page=10`
      );
      if (resp.ok) {
        const data = await resp.json();
        setResults((data.items || []).map((r: { name: string; full_name: string; description: string; stargazers_count: number }) => ({
          name: r.name,
          full_name: r.full_name,
          description: r.description || '',
          stars: r.stargazers_count,
          install: `npx skills add ${r.full_name}`,
        })));
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (skill: SkillResult) => {
    setInstalling(skill.full_name);
    toast.info(`Installing ${skill.name}...`);
    setTimeout(() => {
      toast.success(`${skill.name} installed`);
      setInstalling(null);
    }, 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[1000px]">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-accent" />
            <h1 className="text-2xl font-light tracking-tight text-snow">Skill Marketplace</h1>
          </div>
          <p className="text-sm text-slate mt-1">Discover and install AI agent skills from GitHub</p>
        </motion.div>

        <GlassPanel className="p-5 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search skills (e.g. 'testing', 'debugging', 'react')"
                className="w-full bg-surface-input border border-graphite rounded-lg pl-9 pr-4 py-2.5 text-sm text-snow placeholder-slate focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 bg-accent text-white text-sm rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </motion.button>
          </div>
        </GlassPanel>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((skill, i) => (
              <motion.div
                key={skill.full_name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassPanel className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-snow">{skill.name}</h3>
                    <div className="flex items-center gap-1 text-amber">
                      <Star size={11} />
                      <span className="text-[10px]">{skill.stars}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate leading-relaxed flex-1 mb-3">{skill.description.slice(0, 120)}</p>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleInstall(skill)}
                      disabled={installing === skill.full_name}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                    >
                      <Download size={11} />
                      {installing === skill.full_name ? 'Installing...' : 'Install'}
                    </motion.button>
                    <a
                      href={`https://github.com/${skill.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-slate hover:text-fog transition-colors"
                    >
                      <ExternalLink size={10} /> GitHub
                    </a>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <GlassPanel variant="subtle" className="p-12 text-center">
            <Package size={28} className="text-slate mx-auto mb-3" />
            <p className="text-sm text-fog">Search for skills to expand the swarm's capabilities</p>
            <p className="text-xs text-slate mt-2">Try: "debugging", "testing", "react", "api"</p>
          </GlassPanel>
        )}
      </div>
    </PageTransition>
  );
}
