import { Badge } from '@/lib/badges'

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => (
        <li
          key={badge.id}
          title={badge.description}
          className={`rounded-lg border p-3 text-center ${
            badge.earned
              ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/40'
              : 'border-gray-200 bg-gray-50 opacity-70 dark:border-gray-700 dark:bg-gray-800/60'
          }`}
        >
          <div className={`text-2xl ${badge.earned ? '' : 'grayscale'}`}>{badge.emoji}</div>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{badge.label}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {badge.earned
              ? badge.description
              : `${badge.progress.current}/${badge.progress.target} — ${badge.description}`}
          </p>
        </li>
      ))}
    </ul>
  )
}
