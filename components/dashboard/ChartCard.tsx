interface ChartCardProps {
  title: string
  children: React.ReactNode
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </section>
  )
}
