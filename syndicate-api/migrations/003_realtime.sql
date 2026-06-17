-- Enable Supabase Realtime on core tables
ALTER publication supabase_realtime ADD TABLE agents;
ALTER publication supabase_realtime ADD TABLE tasks;
ALTER publication supabase_realtime ADD TABLE memory;
ALTER publication supabase_realtime ADD TABLE events;
