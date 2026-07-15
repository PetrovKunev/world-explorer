'use client'

import { useRouter } from 'next/navigation'
import { Menu, Globe, LogOut, User, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  onToggleSidebar: () => void
  userEmail: string
}

// Без React state — иконата се превключва с CSS (dark: варианти),
// така няма разминаване между сървърния и клиентския render
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

export default function Header({ onToggleSidebar, userEmail }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 shadow-sm sm:px-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Покажи или скрий списъка с дестинации"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6 dark:text-primary-400" />
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-gray-100">
            World Explorer
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden items-center space-x-1 text-sm text-gray-600 sm:flex dark:text-gray-300">
          <User className="h-4 w-4" />
          <span>{userEmail}</span>
        </div>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Смяна на светла/тъмна тема"
          title="Смяна на темата"
        >
          <Moon className="block h-4 w-4 text-gray-600 dark:hidden" />
          <Sun className="hidden h-4 w-4 text-gray-300 dark:block" />
        </button>

        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Изход"
          title="Изход"
        >
          <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </header>
  )
}
