interface ChartCardProps {
  title: string
  // Кратко пояснение какво точно показва диаграмата
  description?: string
  children: React.ReactNode
}

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}
