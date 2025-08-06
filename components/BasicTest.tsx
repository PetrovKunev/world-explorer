'use client'

import { useState, useEffect } from 'react'

export default function BasicTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [browserInfo, setBrowserInfo] = useState({
    browser: 'Loading...',
    fetch: 'Loading...'
  })

  useEffect(() => {
    setMounted(true)
    setBrowserInfo({
      browser: typeof window !== 'undefined' ? 'Available' : 'Not Available',
      fetch: typeof fetch !== 'undefined' ? 'Available' : 'Not Available'
    })
  }, [])

  const testNetwork = async () => {
    setLoading(true)
    setResult('Тестване на мрежата...')
    
    try {
      // Тест 1: Базов fetch с timeout
      console.log('🔧 Стартиране на мрежов тест...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунди timeout
      
      const response = await fetch('https://httpbin.org/get', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        setResult(`❌ HTTP грешка: ${response.status}`)
        return
      }
      
      setResult('✅ Мрежата работи! Тестване на Supabase...')
      console.log('✅ Базов fetch успешен')
      
      // Тест 2: Supabase URL с по-добри headers
      console.log('🔧 Тестване на Supabase...')
      
      const supabaseResponse = await fetch('https://bflpybciorqdbirqxsj.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text()
        console.error('❌ Supabase error:', errorText)
        setResult(`❌ Supabase грешка: ${supabaseResponse.status} - ${errorText}`)
      } else {
        console.log('✅ Supabase URL работи!')
        setResult('✅ Supabase URL работи!')
      }
      
    } catch (err: unknown) {
      console.error('❌ Network error:', err)
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setResult('❌ Мрежова грешка: Timeout (10 секунди)')
        } else {
          setResult(`❌ Мрежова грешка: ${err.message}`)
        }
      } else {
        setResult(`❌ Мрежова грешка: ${String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const testLocalStorage = () => {
    try {
      localStorage.setItem('test', 'working')
      const value = localStorage.getItem('test')
      localStorage.removeItem('test')
      
      if (value === 'working') {
        setResult('✅ LocalStorage работи!')
      } else {
        setResult('❌ LocalStorage не работи')
      }
    } catch (err) {
      setResult(`❌ LocalStorage грешка: ${err}`)
    }
  }

  const testConsole = () => {
    console.log('🔧 Console test - ако виждате това, console работи!')
    console.error('❌ Error test')
    console.warn('⚠️ Warning test')
    setResult('✅ Console работи! Проверете F12 → Console')
  }

  const testSimpleFetch = async () => {
    setLoading(true)
    setResult('Тестване на прост fetch...')
    
    try {
      console.log('🔧 Тестване на прост fetch...')
      
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      
      if (!response.ok) {
        setResult(`❌ HTTP грешка: ${response.status}`)
        return
      }
      
      const data = await response.json()
      console.log('✅ Simple fetch успешен:', data)
      setResult('✅ Прост fetch работи!')
      
    } catch (err: unknown) {
      console.error('❌ Simple fetch error:', err)
      if (err instanceof Error) {
        setResult(`❌ Прост fetch грешка: ${err.message}`)
      } else {
        setResult(`❌ Прост fetch грешка: ${String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Loading...</h2>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Basic Test</h2>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <strong>Резултат:</strong> {result}
          </div>
          
          <div className="flex space-x-2 flex-wrap gap-2">
            <button
              onClick={testNetwork}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Тестване...' : 'Test Network'}
            </button>
            
            <button
              onClick={testSimpleFetch}
              disabled={loading}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Тестване...' : 'Simple Fetch'}
            </button>
            
            <button
              onClick={testLocalStorage}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Test LocalStorage
            </button>
            
            <button
              onClick={testConsole}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Console
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Browser:</strong> {browserInfo.browser}</p>
            <p><strong>Fetch:</strong> {browserInfo.fetch}</p>
            <p><strong>Status:</strong> {loading ? 'Loading...' : 'Ready'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 