import { createClient } from '@supabase/supabase-js';

// Substitua com as credenciais copiadas do seu projeto Supabase:
const SUPABASE_URL = 'https://dbdnubkcpmggyjciyhkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZG51YmtjcG1nZ3lqY2l5aGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MDUxMjksImV4cCI6MjEwNjQ4MTEyOX0.Z8Hpb31hAHYnblns8HQjENm-FEpnJdV3_e6ztAkHQ3g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);