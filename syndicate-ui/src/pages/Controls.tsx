import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield, Cpu, ToggleLeft, ToggleRight,
  AlertTriangle, Zap,
} from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import GlassPanel from '../components/ui/GlassPanel';
import AnimatedCard from '../components/ui/AnimatedCard';

interface ControlSection {
  title: string;
  icon: JSX.Element;
  description: string;
  children: JSX.Element;
}

function ControlCard({ title, icon, description, children }: ControlSection) {
  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-snow">{title}</h3>
          <p className="text-xs text-slate mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </GlassPanel>
  );
}

function Toggle({
  label,
  enabled,
  onToggle,
  description,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm text-fog">{label}</p>
        {description && (
          <p className="text-[10px] text-slate mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onToggle}
        className="transition-colors"
        style={{ color: enabled ? '#27a644' : '#62666d' }}
      >
        {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-fog">{label}</p>
        <span className="text-xs font-mono text-accent">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-graphite rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-onyx [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(94,106,210,0.4)]"
      />
    </div>
  );
}

function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`syndicate.controls.${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  const setPersisted = (v: T) => {
    setValue(v);
    localStorage.setItem(`syndicate.controls.${key}`, JSON.stringify(v));
  };
  return [value, setPersisted];
}

export default function Controls() {
  const [crossModel, setCrossModel] = usePersistedState('crossModel', true);
  const [autoApprove, setAutoApprove] = usePersistedState('autoApprove', false);
  const [humanApproval, setHumanApproval] = usePersistedState('humanApproval', true);
  const [skillEvolution, setSkillEvolution] = usePersistedState('skillEvolution', true);
  const [maxRounds, setMaxRounds] = usePersistedState('maxRounds', 5);
  const [tokenBudget, setTokenBudget] = usePersistedState('tokenBudget', 50000);
  const [specialistTimeout, setSpecialistTimeout] = usePersistedState('specialistTimeout', 180);

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
            Controls
          </h1>
          <p className="text-sm text-slate mt-1">
            Configure model routing, approval gates, and safety rails
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Model Routing */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <ControlCard
              title="Model Routing"
              icon={<Cpu size={16} />}
              description="Control which LLM models power each agent role."
            >
              <div className="space-y-1 divide-y divide-graphite/50">
                <Toggle
                  label="Cross-Model Adversarial Review"
                  enabled={crossModel}
                  onToggle={() => setCrossModel(!crossModel)}
                  description="Engineer (Gemini) code reviewed by Reviewer (GPT-4o). Different model families catch different blind spots."
                />
                <div className="pt-3">
                  <p className="text-[10px] text-slate uppercase tracking-wide mb-2">
                    Agent → Model Mapping
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { agent: 'Nexus', model: 'gemini-2.5-flash', color: '#5e6ad2' },
                      { agent: 'Architect', model: 'gemini-2.5-flash', color: '#02b8cc' },
                      { agent: 'Engineer', model: 'gemini-2.5-flash', color: '#27a644' },
                      { agent: 'Reviewer', model: 'gpt-4o (Azure)', color: '#eb5757' },
                      { agent: 'Researcher', model: 'gemini-2.5-flash', color: '#e4f222' },
                      { agent: 'QA', model: 'gemini-2.5-flash', color: '#8a8f98' },
                    ].map(({ agent, model, color }) => (
                      <div
                        key={agent}
                        className="flex items-center justify-between py-1.5 px-3 rounded-md bg-obsidian/30"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-fog">{agent}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate">
                          {model}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ControlCard>
          </motion.div>

          {/* Approval Gates */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <ControlCard
              title="Approval Gates"
              icon={<Shield size={16} />}
              description="Control when human approval is required before actions execute."
            >
              <div className="space-y-1 divide-y divide-graphite/50">
                <Toggle
                  label="Human Approval Required"
                  enabled={humanApproval}
                  onToggle={() => setHumanApproval(!humanApproval)}
                  description="Require human approval before executing high-risk actions (file writes, git operations)."
                />
                <Toggle
                  label="Auto-Approve Low Risk"
                  enabled={autoApprove}
                  onToggle={() => setAutoApprove(!autoApprove)}
                  description="Automatically approve actions classified as low-risk by the Reviewer."
                />
              </div>
            </ControlCard>
          </motion.div>

          {/* Safety Rails */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <ControlCard
              title="Safety Rails"
              icon={<AlertTriangle size={16} />}
              description="Budget caps and timeout limits — enforced in code, not convention."
            >
              <div className="space-y-2">
                <SliderControl
                  label="Max Review Rounds"
                  value={maxRounds}
                  min={1}
                  max={10}
                  unit=" rounds"
                  onChange={setMaxRounds}
                />
                <SliderControl
                  label="Token Budget (per task)"
                  value={tokenBudget}
                  min={10000}
                  max={200000}
                  unit=" tokens"
                  onChange={setTokenBudget}
                />
                <SliderControl
                  label="Specialist Timeout"
                  value={specialistTimeout}
                  min={30}
                  max={300}
                  unit="s"
                  onChange={setSpecialistTimeout}
                />
              </div>
            </ControlCard>
          </motion.div>

          {/* Self-Improvement */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <ControlCard
              title="Self-Improvement"
              icon={<Zap size={16} />}
              description="SkillOpt loop — agent skills evolve based on measured performance."
            >
              <div className="space-y-1">
                <Toggle
                  label="Skill Evolution"
                  enabled={skillEvolution}
                  onToggle={() => setSkillEvolution(!skillEvolution)}
                  description="After every epoch (N tasks), analyze outcomes and propose prompt deltas to improve agent performance."
                />
              </div>
            </ControlCard>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
