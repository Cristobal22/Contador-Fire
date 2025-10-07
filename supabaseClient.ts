import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdnuomgpagjqizwvczra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbnVvbWdwYWdqcWl6d3ZjenJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyODAzMDUsImV4cCI6MjA3NDg1NjMwNX0.A3TlOUiY-c_Gqd_OfoDrAlrnPwxCIOJLKbXYeoCJqLU';

// @ts-ignore
export const supabase = createClient(supabaseUrl, supabaseAnonKey);