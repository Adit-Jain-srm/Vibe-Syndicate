-- RLS policies for Supabase anon access
-- Enables the frontend to read/write directly via Supabase client with anon key.

-- Enable Row Level Security on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;

-- Allow anon to read all tables
CREATE POLICY "anon_read_agents" ON agents FOR SELECT USING (true);
CREATE POLICY "anon_read_tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "anon_read_events" ON events FOR SELECT USING (true);
CREATE POLICY "anon_read_memory" ON memory FOR SELECT USING (true);

-- Allow anon to insert tasks, events, and memory (for the demo)
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_memory" ON memory FOR INSERT WITH CHECK (true);

-- Allow anon to update tasks (status changes from frontend)
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE USING (true) WITH CHECK (true);

-- Enable Supabase Realtime on the events table
ALTER PUBLICATION supabase_realtime ADD TABLE events;
