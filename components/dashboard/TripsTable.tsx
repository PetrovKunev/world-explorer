import { Trip } from '@/lib/stats'
import { flagEmoji } from '@/lib/geo/continents'

export function formatTripPeriod(trip: Trip): string {
  const format = (iso: string) => new Date(iso).toLocaleDateString('bg-BG')
  if (trip.start === trip.end) return format(trip.start)
  return `${format(trip.start)} – ${format(trip.end)}`
}

const headerClass =
  'py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'

export default function TripsTable({ trips }: { trips: Trip[] }) {
  // Най-новите пътувания най-отгоре (trips() връща хронологичен ред)
  const rows = [...trips].reverse()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={headerClass}>Период</th>
            <th className={`${headerClass} text-right`}>Дни</th>
            <th className={`${headerClass} text-right`}>Места</th>
            <th className={`${headerClass} pl-4`}>Държави</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((trip) => (
            <tr
              key={trip.start}
              className="border-b border-gray-100 last:border-b-0 dark:border-gray-700/60"
            >
              <td className="whitespace-nowrap py-2 text-gray-900 dark:text-gray-100">
                {formatTripPeriod(trip)}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {trip.days}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {trip.placeCount}
              </td>
              <td className="py-2 pl-4 text-gray-700 dark:text-gray-300" title={trip.countryCodes.join(', ')}>
                {trip.countryCodes.length > 0
                  ? trip.countryCodes.map((code) => flagEmoji(code)).join(' ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
