const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bflpybciorqdbirqxsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTable() {
  try {
    console.log('🔍 Проверка на таблицата destinations...')
    
    // Тестваме дали таблицата съществува
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Грешка:', error.message)
      console.log('💡 Трябва да изпълните SQL скрипта в Supabase Dashboard')
      console.log('📋 Копирайте кода от database/create-table.sql')
    } else {
      console.log('✅ Таблицата destinations съществува!')
      console.log('📊 Брой записи:', data.length)
    }
    
  } catch (error) {
    console.error('❌ Грешка:', error.message)
  }
}

testTable() 