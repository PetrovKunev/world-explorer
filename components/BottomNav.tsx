'use client'

import Link from 'next/link'
import { Map, List, LayoutDashboard } from 'lucide-react'

interface BottomNavProps {
  current: 'map' | 'dashboard'
  // На картата „Списък“ отваря страничния панел; на таблото води към картата
  // с отворен списък (/?list=1)
  onShowList?: () => void
}

const itemClass = (active: boolean) =>
  `flex flex-1 flex-col items-center justify-center space-y-0.5 py-1.5 text-xs transition-colors ${
    active
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
  }`

export default function BottomNav({ current, onShowList }: BottomNavProps) {
  return (
    <nav
      className="flex border-t border-gray-200 bg-white lg:hidden dark:border-gray-700 dark:bg-gray-800"
      aria-label="Основна навигация"
    >
      {current === 'map' ? (
        <span className={itemClass(true)} aria-current="page">
          <Map className="h-5 w-5" />
          <span>Карта</span>
        </span>
      ) : (
        <Link href="/" className={itemClass(false)}>
          <Map className="h-5 w-5" />
          <span>Карта</span>
        </Link>
      )}

      {onShowList ? (
        <button onClick={onShowList} className={itemClass(false)}>
          <List className="h-5 w-5" />
          <span>Списък</span>
        </button>
      ) : (
        <Link href="/?list=1" className={itemClass(false)}>
          <List className="h-5 w-5" />
          <span>Списък</span>
        </Link>
      )}

      {current === 'dashboard' ? (
        <span className={itemClass(true)} aria-current="page">
          <LayoutDashboard className="h-5 w-5" />
          <span>Табло</span>
        </span>
      ) : (
        <Link href="/dashboard" className={itemClass(false)}>
          <LayoutDashboard className="h-5 w-5" />
          <span>Табло</span>
        </Link>
      )}
    </nav>
  )
}
