CREATE TABLE IF NOT EXISTS task_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  first_pass_rate boolean DEFAULT false,
  iteration_count integer DEFAULT 1,
  time_to_complete_seconds float,
  tokens_used integer DEFAULT 0,
  agents_involved text[] DEFAULT '{}',
  review_score float,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id)
);

ALTER TABLE task_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_metrics" ON task_metrics FOR SELECT USING (true);
CREATE POLICY "anon_insert_metrics" ON task_metrics FOR INSERT WITH CHECK (true);
ALTER publication supabase_realtime ADD TABLE task_metrics;
