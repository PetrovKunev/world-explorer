interface StatTileProps {
  label: string
  value: string
  hint?: string
  // Пълно обяснение на показателя — вижда се при задържане на мишката
  title?: string
}

export default function StatTile({ label, value, hint, title }: StatTileProps) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      title={title}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}
