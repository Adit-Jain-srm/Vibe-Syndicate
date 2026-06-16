import { motion } from 'motion/react';
import { Settings as SettingsIcon, Key, Globe, GitBranch, Bell } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';

export default function Settings() {
  return (
    <PageTransition>
      <div className="min-h-screen p-8 max-w-[900px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light tracking-tight text-snow">
            Settings
          </h1>
          <p className="text-sm text-slate mt-1">
            Workspace configuration and API keys
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* API Keys */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center text-amber shrink-0">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-snow">API Keys</h3>
                  <p className="text-xs text-slate mt-0.5">
                    LLM provider credentials for the agent swarm
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Google Gemini API Key', env: 'GOOGLE_API_KEY', status: 'configured' },
                  { label: 'Azure OpenAI API Key', env: 'AZURE_OPENAI_API_KEY', status: 'configured' },
                  { label: 'Band.ai API Key', env: 'BAND_API_KEY', status: 'configured' },
                  { label: 'Supabase Key', env: 'SUPABASE_KEY', status: 'configured' },
                ].map(({ label, env, status }) => (
                  <div
                    key={env}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-obsidian/30"
                  >
                    <div>
                      <p className="text-xs text-fog">{label}</p>
                      <p className="text-[10px] text-slate font-mono mt-0.5">{env}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      status === 'configured'
                        ? 'bg-emerald/10 text-emerald'
                        : 'bg-crimson/10 text-crimson'
                    }`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Workspace */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-snow">Workspace</h3>
                  <p className="text-xs text-slate mt-0.5">
                    Project context and environment
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-xs text-fog">Environment</p>
                  <span className="text-xs font-mono text-accent">development</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-xs text-fog">API URL</p>
                  <span className="text-[10px] font-mono text-slate">
                    {window.location.origin}/api
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-xs text-fog">Band Account</p>
                  <span className="text-[10px] font-mono text-slate">
                    328db018-1c47-4e22-a080-5a0db897ca72
                  </span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Version */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <GlassPanel className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shrink-0">
                  <GitBranch size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-snow">Version</h3>
                  <p className="text-xs text-slate mt-0.5">
                    Syndicate system information
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-[10px] text-slate uppercase tracking-wide">UI</p>
                  <p className="text-xs font-mono text-fog mt-1">v0.2.0</p>
                </div>
                <div className="py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-[10px] text-slate uppercase tracking-wide">API</p>
                  <p className="text-xs font-mono text-fog mt-1">v0.2.0</p>
                </div>
                <div className="py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-[10px] text-slate uppercase tracking-wide">Agent</p>
                  <p className="text-xs font-mono text-fog mt-1">v0.2.0</p>
                </div>
                <div className="py-2 px-3 rounded-md bg-obsidian/30">
                  <p className="text-[10px] text-slate uppercase tracking-wide">Band SDK</p>
                  <p className="text-xs font-mono text-fog mt-1">thenvoi</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
