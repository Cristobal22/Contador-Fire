import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulwcqadbknnlqmcamccz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsd2NxYWRia25ubHFtY2FtY2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjY4NjYsImV4cCI6MjA3NTQ0Mjg2Nn0.ATOlyjUK8oNolk3bTcNoMKREgd8mAW2W4TzXziwUnSY';

// @ts-ignore
export const supabase = createClient(supabaseUrl, supabaseAnonKey);