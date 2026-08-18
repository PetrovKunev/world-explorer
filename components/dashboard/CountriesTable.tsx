import { CountryRow } from '@/lib/stats'
import { flagEmoji } from '@/lib/geo/continents'

const headerClass =
  'py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'

const numberCellClass = 'py-2 text-right tabular-nums text-gray-700 dark:text-gray-300'

export default function CountriesTable({ rows }: { rows: CountryRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={headerClass}>Държава</th>
            <th className={`${headerClass} text-right`}>Места</th>
            <th className={`${headerClass} text-right`}>Посетени</th>
            <th className={`${headerClass} text-right`}>Планирани</th>
            <th className={`${headerClass} text-right`}>Оценка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.country_code}
              className="border-b border-gray-100 last:border-b-0 dark:border-gray-700/60"
            >
              <td className="whitespace-nowrap py-2 text-gray-900 dark:text-gray-100">
                <span className="mr-1.5">{flagEmoji(row.country_code)}</span>
                {row.country}
              </td>
              <td className={numberCellClass}>{row.places}</td>
              <td className={numberCellClass}>{row.visitedCount}</td>
              <td className={numberCellClass}>{row.plannedCount}</td>
              <td className={numberCellClass}>
                {row.averageRating != null ? `${row.averageRating} ★` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
