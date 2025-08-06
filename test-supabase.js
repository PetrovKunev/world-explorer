const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bflpybciorqdbirqxsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔗 Тестване на Supabase връзка...')
    console.log('📊 Supabase URL:', supabaseUrl)
    console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...')
    
    // Тестваме връзката с прост ping
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Грешка при връзка:', error.message)
    } else {
      console.log('✅ Връзката работи!')
      console.log('📋 Session data:', data)
    }
    
  } catch (error) {
    console.error('❌ Грешка:', error.message)
    console.log('💡 Това може да е заради мрежови проблем или неправилни credentials')
  }
}

testConnection() 