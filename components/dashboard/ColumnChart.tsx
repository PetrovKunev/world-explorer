// Вертикална стълбовидна диаграма за една серия — без легенда,
// стойностите стоят над колоните, нулевите години остават с отметка
// на базовата линия, за да е честна времевата ос

interface ColumnChartProps {
  items: { label: string; value: number; title?: string }[]
}

export default function ColumnChart({ items }: ColumnChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="flex items-end gap-1.5" role="img">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-1 flex-col items-center"
          title={item.title ?? `${item.label}: ${item.value}`}
        >
          <span className="mb-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {item.value > 0 ? item.value : ' '}
          </span>
          <div className="flex h-32 w-full max-w-10 items-end">
            {item.value > 0 ? (
              <div
                className="w-full rounded-t bg-primary-600 dark:bg-primary-500"
                style={{ height: `${Math.max((item.value / max) * 100, 3)}%` }}
              />
            ) : (
              <div className="h-0.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
          <span className="mt-1.5 max-w-full truncate text-xs text-gray-500 dark:text-gray-400">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
