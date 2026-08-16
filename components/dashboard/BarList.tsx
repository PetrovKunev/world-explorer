// Хоризонтални барове за една серия — етикет, тънък бар и стойност на реда;
// стойностите са в текстов цвят, барът носи само големината

interface BarListProps {
  items: { key: string; label: string; value: number; icon?: string }[]
}

export default function BarList({ items }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-3" title={`${item.label}: ${item.value}`}>
          <span className="w-36 shrink-0 truncate text-sm text-gray-700 dark:text-gray-300">
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            {item.label}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <span
              className="block h-full rounded-full bg-primary-600 dark:bg-primary-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  )
}
