'use client'

import { Menu, Globe, MapPin, Star } from 'lucide-react'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
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
        
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 hidden xs:inline">Travel Map</span>
        </div>
      </div>
    </header>
  )
} 