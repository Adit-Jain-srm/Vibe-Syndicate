-- Syndicate Database Schema
-- Run this in Supabase SQL Editor to bootstrap the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AGENTS: Registry of all swarm agents
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('nexus', 'architect', 'engineer', 'reviewer', 'researcher', 'qa')),
    description TEXT DEFAULT '',
    model TEXT DEFAULT '',
    band_agent_id TEXT,
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'thinking', 'error')),
    capabilities JSONB DEFAULT '[]'::jsonb,
    performance_score REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS: Development tasks submitted to the swarm
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'planning', 'in_progress', 'reviewing', 'complete', 'failed')),
    complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('simple', 'medium', 'complex')),
    plan TEXT,
    result TEXT,
    agents_involved TEXT[] DEFAULT '{}',
    band_room_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- SUBTASKS: Decomposed units of work within a task
-- ============================================================
CREATE TABLE IF NOT EXISTS subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    subtask_key TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES agents(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'reviewing', 'complete', 'failed')),
    files TEXT[] DEFAULT '{}',
    acceptance_criteria TEXT DEFAULT '',
    code_output TEXT,
    review_verdict JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS: All agent activity (the audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    agent TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_task_id ON events(task_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_agent ON events(agent);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ============================================================
-- MEMORY: Persistent learnings (compound intelligence core)
-- ============================================================
CREATE TABLE IF NOT EXISTS memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('protocol_state', 'project', 'agent_learning', 'skill_evolution')),
    agent TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_category ON memory(category);
CREATE INDEX idx_memory_agent ON memory(agent);
CREATE INDEX idx_memory_status ON memory(status);
CREATE INDEX idx_memory_tags ON memory USING GIN(tags);

-- ============================================================
-- SKILLS: Agent skill documents that evolve over time
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_role TEXT NOT NULL,
    version INT DEFAULT 1,
    content TEXT NOT NULL,
    changelog TEXT DEFAULT '',
    performance_before REAL,
    performance_after REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_agent_role ON skills(agent_role);

-- ============================================================
-- Seed default agents
-- ============================================================
INSERT INTO agents (name, role, description, model) VALUES
    ('Nexus', 'nexus', 'Conductor — coordination hub, routes tasks, tracks progress', 'gemini-2.5-flash'),
    ('Architect', 'architect', 'Planner — decomposes tasks into structured subtasks', 'gemini-2.5-flash'),
    ('Engineer', 'engineer', 'Coder — implements code from subtask assignments', 'gemini-2.5-flash'),
    ('Reviewer', 'reviewer', 'Quality gate — adversarial cross-model code review', 'claude-sonnet-4'),
    ('Researcher', 'researcher', 'Web research, prior art discovery, tool finding', 'gemini-2.5-flash'),
    ('QA', 'qa', 'Testing and validation agent', 'gemini-2.5-flash')
ON CONFLICT (name) DO NOTHING;
