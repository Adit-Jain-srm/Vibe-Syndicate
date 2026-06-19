import { motion } from 'motion/react';
import PageTransition from '../components/ui/PageTransition';

const MCP_TOOLS = [
  { name: 'syn_init', desc: 'Initialize Syndicate for a project', example: 'syn_init({project_name: "my-app"})' },
  { name: 'syn_task', desc: 'Send a task to the swarm', example: 'syn_task({description: "add rate limiting", complexity: "medium"})' },
  { name: 'syn_status', desc: 'Check agents, tasks, approvals', example: 'syn_status({})' },
  { name: 'syn_review', desc: 'Request adversarial code review', example: 'syn_review({code: "function...", context: "auth middleware"})' },
  { name: 'syn_memory', desc: 'Query/store persistent memory', example: 'syn_memory({action: "query", category: "project"})' },
  { name: 'syn_find_tool', desc: 'Search for skills/tools', example: 'syn_find_tool({need: "testing e2e"})' },
  { name: 'syn_install_skill', desc: 'Install a skill from GitHub', example: 'syn_install_skill({repo: "owner/skill-name"})' },
  { name: 'syn_list_skills', desc: 'List all installed skills', example: 'syn_list_skills({})' },
  { name: 'syn_skill_info', desc: 'Read a skill\'s SKILL.md', example: 'syn_skill_info({skill_name: "autonomous-bug-fixing"})' },
];

const SETUP_STEPS = [
  { title: 'Clone and install', cmd: 'git clone https://github.com/Adit-Jain-srm/Vibe-Syndicate.git\ncd Vibe-Syndicate\ncp .env.example .env' },
  { title: 'Configure .env', cmd: 'GOOGLE_API_KEY=AIza...\nAZURE_OPENAI_ENDPOINT=https://...\nAZURE_OPENAI_API_KEY=...\nSUPABASE_URL=https://....supabase.co\nSUPABASE_KEY=eyJ...' },
  { title: 'Start frontend', cmd: 'cd syndicate-ui\nnpm install\nnpm run dev' },
  { title: 'Start agent swarm', cmd: 'python -m syndicate_agent.main' },
  { title: 'MCP (Cursor auto-loads from .cursor/mcp.json)', cmd: '# Already configured:\n{\n  "mcpServers": {\n    "syndicate": {\n      "command": "python",\n      "args": ["syndicate-mcp/server.py"]\n    }\n  }\n}' },
];

const SKILL_COMMANDS = [
  { title: 'List installed skills', cmd: 'npx skills list' },
  { title: 'Install a skill', cmd: 'npx skills add owner/repo-name' },
  { title: 'Search skills', cmd: '# Via MCP:\nsyn_find_tool({need: "debugging"})' },
  { title: 'Read skill info', cmd: '# Via MCP:\nsyn_skill_info({skill_name: "elite-execution-philosophy"})' },
];

export default function Docs() {
  return (
    <PageTransition>
      <div className="min-h-screen p-6 md:p-8 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-light text-snow tracking-tight mb-2"
        >
          Documentation
        </motion.h1>
        <p className="text-sm text-slate mb-10">Setup, MCP integration, skills, and commands</p>

        {/* Setup */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">Setup</h2>
          <div className="space-y-4">
            {SETUP_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-graphite bg-charcoal p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-accent">{i + 1}</span>
                  <span className="text-sm text-fog font-medium">{step.title}</span>
                </div>
                <pre className="text-xs text-slate font-mono whitespace-pre-wrap leading-relaxed bg-deep rounded p-3 overflow-x-auto">
                  {step.cmd}
                </pre>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MCP Tools */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">MCP Tools (9)</h2>
          <p className="text-xs text-slate mb-4">These tools are available in Cursor IDE automatically via .cursor/mcp.json</p>
          <div className="space-y-3">
            {MCP_TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className="rounded-lg border border-graphite bg-charcoal p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-sm text-accent font-mono">{tool.name}</code>
                </div>
                <p className="text-xs text-slate mb-2">{tool.desc}</p>
                <pre className="text-[11px] text-fog/60 font-mono bg-deep rounded px-3 py-2 overflow-x-auto">
                  {tool.example}
                </pre>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">Skills Integration</h2>
          <p className="text-xs text-slate mb-4">77 skills installed across .cursor/skills/ and .agents/skills/</p>
          <div className="space-y-3">
            {SKILL_COMMANDS.map((cmd, i) => (
              <motion.div
                key={cmd.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="rounded-lg border border-graphite bg-charcoal p-4"
              >
                <span className="text-sm text-fog font-medium">{cmd.title}</span>
                <pre className="text-xs text-slate font-mono whitespace-pre-wrap mt-2 bg-deep rounded p-3">
                  {cmd.cmd}
                </pre>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">Architecture</h2>
          <div className="rounded-lg border border-graphite bg-charcoal p-4">
            <pre className="text-xs text-slate font-mono whitespace-pre leading-relaxed">{`User (Cursor/Dashboard)
  |
  v
MCP Server (syn_*) / Supabase INSERT
  |
  v
EventBridge.watch_for_tasks() [polls every 5s]
  |
  v
Band Agents process via rooms
  |
  v
bridge.on_agent_response() -> classifies -> emits events
  |
  v
On TASK_COMPLETE:
  MetricsEngine.compute_and_store()
  SelfImprovementEngine.run_cycle()
  Memory stored with embedding
  |
  v
Dashboard (Supabase Realtime -> Zustand -> React)`}</pre>
          </div>
        </section>

        {/* Database */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">Database Tables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-graphite">
                  <th className="text-left py-2 text-fog font-medium">Table</th>
                  <th className="text-left py-2 text-fog font-medium">Purpose</th>
                  <th className="text-left py-2 text-fog font-medium">RLS</th>
                  <th className="text-left py-2 text-fog font-medium">Realtime</th>
                </tr>
              </thead>
              <tbody className="text-slate">
                {[
                  ['agents', 'Agent roster + status', 'anon read', 'yes'],
                  ['tasks', 'Task lifecycle', 'anon read/write', 'yes'],
                  ['events', 'Immutable event log', 'anon read/write', 'yes'],
                  ['memory', 'Persistent learnings + embeddings', 'anon read/write', 'yes'],
                  ['task_metrics', 'Performance KPIs', 'anon read/write', 'yes'],
                  ['approvals', 'HITL decisions', 'anon read/write/update', 'yes'],
                ].map(([table, purpose, rls, rt]) => (
                  <tr key={table} className="border-b border-graphite/50">
                    <td className="py-2 font-mono text-accent">{table}</td>
                    <td className="py-2">{purpose}</td>
                    <td className="py-2">{rls}</td>
                    <td className="py-2">{rt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Testing */}
        <section className="mb-12">
          <h2 className="text-base font-medium text-snow mb-4">Testing (33 tests)</h2>
          <div className="rounded-lg border border-graphite bg-charcoal p-4 space-y-3">
            <div>
              <span className="text-xs text-fog font-medium">Unit tests (26)</span>
              <pre className="text-xs text-slate font-mono mt-1">python -m pytest tests/test_band.py tests/test_metrics.py tests/test_mcp.py -v</pre>
            </div>
            <div>
              <span className="text-xs text-fog font-medium">Integration tests (6)</span>
              <pre className="text-xs text-slate font-mono mt-1">python -m pytest tests/test_supabase.py -v</pre>
            </div>
            <div>
              <span className="text-xs text-fog font-medium">E2E flow (1)</span>
              <pre className="text-xs text-slate font-mono mt-1">python -m pytest tests/test_e2e.py -v</pre>
            </div>
            <div>
              <span className="text-xs text-fog font-medium">All tests</span>
              <pre className="text-xs text-slate font-mono mt-1">python -m pytest tests/ -v</pre>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
