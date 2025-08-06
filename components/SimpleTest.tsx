'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Тестване...')
    
    try {
      // Тест 1: Auth
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        setResult(`❌ Auth грешка: ${authError.message}`)
        return
      }
      
      setResult('✅ Auth работи! Тестване на таблицата...')
      
      // Тест 2: Table access
      const { data, error } = await supabase
        .from('destinations')
        .select('count')
        .limit(0)

      if (error) {
        setResult(`❌ Table грешка: ${error.message}`)
      } else {
        setResult('✅ Всичко работи! Supabase е свързан успешно.')
      }
      
    } catch (err) {
      setResult(`❌ Неочаквана грешка: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignUp = async () => {
    setLoading(true)
    setResult('Регистрация...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      })

      if (error) {
        setResult(`❌ Регистрация грешка: ${error.message}`)
      } else {
        setResult('✅ Регистрация успешна!')
        console.log('Sign up data:', data)
      }
      
    } catch (err) {
      setResult(`❌ Регистрация грешка: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Supabase Test</h2>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <strong>Резултат:</strong> {result}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={testConnection}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Тестване...' : 'Test Connection'}
            </button>
            
            <button
              onClick={testSignUp}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Test Sign Up'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>URL:</strong> https://bflpybciorqdbirqxsj.supabase.co</p>
            <p><strong>Status:</strong> {loading ? 'Loading...' : 'Ready'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 