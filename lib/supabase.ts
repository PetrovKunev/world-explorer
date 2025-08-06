import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bflpybciorqdibqrxsej.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8'

// Debug информация
console.log('🔧 Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey.substring(0, 20) + '...')

// Проверка на валидността на credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Info': 'supabase-js/2.x'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Тестваме връзката при инициализация
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully')
  }
}) 