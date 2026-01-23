import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntkkdtklfckwthdhugvk.supabase.co'; // Replace with your real Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50a2tkdGtsZmNrd3RoZGh1Z3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTAzNDQsImV4cCI6MjA4NDY4NjM0NH0.qsIIoC8GOip2uR4HD4PZyagD4D9sD4MxkUfA2ADy_qY'; // Replace with your real Supabase anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
