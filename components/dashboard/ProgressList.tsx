// Progress bar-ове: стойност спрямо собствен максимум (напр. посетени
// държави от всички в континента), с „value/total“ отдясно

interface ProgressListProps {
  items: { key: string; label: string; value: number; total: number; icon?: string }[]
}

export default function ProgressList({ items }: ProgressListProps) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-3"
          title={`${item.label}: ${item.value} от ${item.total}`}
        >
          <span className="w-36 shrink-0 truncate text-sm text-gray-700 dark:text-gray-300">
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            {item.label}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <span
              className="block h-full rounded-full bg-primary-600 dark:bg-primary-500"
              style={{ width: `${Math.min((item.value / Math.max(item.total, 1)) * 100, 100)}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
            {item.value}/{item.total}
          </span>
        </li>
      ))}
    </ul>
  )
}
