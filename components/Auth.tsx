'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Auth() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError('Регистрацията не беше успешна. Проверете данните и опитайте отново.')
      } else {
        setSuccess('Проверете имейла си за линк за потвърждение!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Грешен имейл или парола.')
      } else {
        // Сесията е записана в cookies — сървърът ще рендерира приложението
        router.refresh()
        return
      }
    }

    setPending(false)
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="mb-6 flex flex-col items-center space-y-2">
          <Globe className="h-10 w-10 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">World Explorer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSignUp ? 'Създайте акаунт, за да запазвате дестинации' : 'Влезте, за да видите картата си'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Имейл
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Парола
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Моля, изчакайте…' : isSignUp ? 'Регистрация' : 'Вход'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setSuccess(null)
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {isSignUp ? 'Вече имате акаунт? Влезте' : 'Нямате акаунт? Регистрирайте се'}
          </button>
        </div>
      </div>
    </div>
  )
}
