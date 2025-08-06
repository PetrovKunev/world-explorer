import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bflpybciorqdbirqxsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 