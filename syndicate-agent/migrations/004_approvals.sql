CREATE TABLE IF NOT EXISTS approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'review_approval',
  status text NOT NULL DEFAULT 'pending',
  title text NOT NULL,
  description text,
  context jsonb DEFAULT '{}',
  agent text NOT NULL,
  risk_level text DEFAULT 'medium',
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_approvals" ON approvals FOR SELECT USING (true);
CREATE POLICY "anon_insert_approvals" ON approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_approvals" ON approvals FOR UPDATE USING (true);
ALTER publication supabase_realtime ADD TABLE approvals;
CREATE INDEX IF NOT EXISTS approvals_status_idx ON approvals(status);
CREATE INDEX IF NOT EXISTS approvals_task_id_idx ON approvals(task_id);
