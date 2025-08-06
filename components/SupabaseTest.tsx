'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>('Testing...')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  const testNetworkConnection = async () => {
    try {
      setStatus('Testing network connection...')
      setError(null)
      setDebugInfo([])
      
      addDebugInfo('Testing direct fetch to Supabase...')
      
      // Директен fetch тест
      const response = await fetch('https://bflpybciorqdbirqxsj.supabase.co/rest/v1/destinations?select=count', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHB5YmNpb3JxZGlicXJ4c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUwNzEsImV4cCI6MjA2OTk4MTA3MX0.eCnD02jGgs4H1DFKwYDCy_RHf7EkjsRd6vJf9dK9_T8'
        }
      })

      addDebugInfo(`Response status: ${response.status}`)
      addDebugInfo(`Response ok: ${response.ok}`)

      if (!response.ok) {
        const errorText = await response.text()
        addDebugInfo(`Error response: ${errorText}`)
        setError(`Network error: ${response.status} - ${errorText}`)
        setStatus('Network test failed')
        return
      }

      const data = await response.json()
      addDebugInfo(`Response data: ${JSON.stringify(data)}`)
      setStatus('Network test successful!')
      
    } catch (err) {
      addDebugInfo(`Network error: ${err}`)
      setError(`Network error: ${err}`)
      setStatus('Network test failed')
    }
  }

  const testSupabaseConnection = async () => {
    try {
      setStatus('Testing Supabase connection...')
      setError(null)
      setDebugInfo([])
      
      addDebugInfo('Starting connection test...')
      
      // Тест 1: Проверка на връзката
      addDebugInfo('Testing auth.getSession()...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addDebugInfo(`Session error: ${sessionError.message}`)
        setError(`Session error: ${sessionError.message}`)
        setStatus('Failed')
        return
      }

      addDebugInfo('Session test passed')
      setStatus('Connection successful!')
      
      // Тест 2: Проверка на таблицата
      addDebugInfo('Testing table access...')
      const { data: tableData, error: tableError } = await supabase
        .from('destinations')
        .select('*')
        .limit(1)

      if (tableError) {
        addDebugInfo(`Table error: ${tableError.message}`)
        setError(`Table error: ${tableError.message}`)
        setStatus('Table access failed')
      } else {
        addDebugInfo('Table access successful')
        setStatus('All tests passed! Supabase is working correctly.')
      }

    } catch (err) {
      addDebugInfo(`Unexpected error: ${err}`)
      setError(`Unexpected error: ${err}`)
      setStatus('Failed')
    }
  }

  const testSignUp = async () => {
    try {
      setStatus('Testing sign up...')
      setError(null)
      addDebugInfo('Starting sign up test...')
      
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      })

      if (error) {
        addDebugInfo(`Sign up error: ${error.message}`)
        setError(`Sign up error: ${error.message}`)
        setStatus('Sign up failed')
      } else {
        addDebugInfo('Sign up successful')
        setStatus('Sign up successful!')
        console.log('Sign up data:', data)
      }

    } catch (err) {
      addDebugInfo(`Sign up error: ${err}`)
      setError(`Sign up error: ${err}`)
      setStatus('Sign up failed')
    }
  }

  const testSimpleQuery = async () => {
    try {
      setStatus('Testing simple query...')
      setError(null)
      addDebugInfo('Testing simple query...')
      
      // Прост тест без authentication
      const { data, error } = await supabase
        .from('destinations')
        .select('count')
        .limit(0)

      if (error) {
        addDebugInfo(`Simple query error: ${error.message}`)
        setError(`Simple query error: ${error.message}`)
        setStatus('Simple query failed')
      } else {
        addDebugInfo('Simple query successful')
        setStatus('Simple query successful!')
      }

    } catch (err) {
      addDebugInfo(`Simple query error: ${err}`)
      setError(`Simple query error: ${err}`)
      setStatus('Simple query failed')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Supabase Test</h2>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <strong>Status:</strong> {status}
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="flex space-x-2 flex-wrap gap-2">
            <button
              onClick={testNetworkConnection}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Test Network
            </button>
            
            <button
              onClick={testSupabaseConnection}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Connection
            </button>
            
            <button
              onClick={testSignUp}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Sign Up
            </button>
            
            <button
              onClick={testSimpleQuery}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Simple Query
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>URL:</strong> https://bflpybciorqdbirqxsj.supabase.co</p>
            <p><strong>Key:</strong> eyJhbGciOiJIUzI1NiIs...</p>
          </div>
          
          {debugInfo.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <div className="bg-gray-100 p-3 rounded text-xs max-h-40 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 