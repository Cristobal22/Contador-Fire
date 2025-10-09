
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulwcqadbknnlqmcamccz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsd2NxYWRia25ubHFtY2FtY2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjY4NjYsImV4cCI6MjA3NTQ0Mjg2Nn0.ATOlyjUK8oNolk3bTcNoMKREgd8mAW2W4TzXziwUnSY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTable() {
    const { error } = await supabase.from('chart_of_accounts').select();

    if (error && error.code === '42P01') {
        // Table does not exist, so create it
        const { error: createError } = await supabase.rpc('exec', {
            sql: `
                CREATE TABLE chart_of_accounts (
                    id SERIAL PRIMARY KEY,
                    company_id INT NOT NULL,
                    code TEXT NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL
                );
            `
        });

        if (createError) {
            console.error('Error creating table:', createError);
        } else {
            console.log('Table created successfully');
        }
    } else if (error) {
        console.error('Error checking for table:', error);
    } else {
        console.log('Table already exists');
    }
}

createTable();
