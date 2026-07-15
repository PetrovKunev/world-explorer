'use client'

import { useRouter } from 'next/navigation'
import { Menu, Globe, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  onToggleSidebar: () => void
  userEmail: string
}

export default function Header({ onToggleSidebar, userEmail }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="Покажи или скрий списъка с дестинации"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">World Explorer</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden items-center space-x-1 text-sm text-gray-600 sm:flex">
          <User className="h-4 w-4" />
          <span>{userEmail}</span>
        </div>

        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="Изход"
          title="Изход"
        >
          <LogOut className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </header>
  )
}
