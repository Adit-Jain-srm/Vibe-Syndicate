import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://wilwqoflckenzgnggbgb.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbHdxb2ZsY2tlbnpnbmdnYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDgxNzQsImV4cCI6MjA5NzEyNDE3NH0.pBBgId-CYOrpaUSdRnT1PL1Svc8-c-l87ofFUE2K4MI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});
