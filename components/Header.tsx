'use client'

import { Menu, Globe, MapPin, Star, LogOut, User } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
  user: SupabaseUser | null
}

export default function Header({ onToggleSidebar, sidebarOpen, user }: HeaderProps) {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">World Explorer</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Track your travels</span>
        </div>
        
        {user && (
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 hidden xs:inline">Travel Map</span>
        </div>
      </div>
    </header>
  )
} 