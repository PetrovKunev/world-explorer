import { createClient } from '@/lib/supabase/server'
import Auth from '@/components/Auth'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import StatTile from '@/components/dashboard/StatTile'
import ChartCard from '@/components/dashboard/ChartCard'
import ColumnChart from '@/components/dashboard/ColumnChart'
import BarList from '@/components/dashboard/BarList'
import {
  overviewStats,
  ratingDistribution,
  topCountries,
  typeDistribution,
  visitsByYear,
} from '@/lib/stats'
import { flagEmoji } from '@/lib/geo/continents'
import { Destination, DESTINATION_TYPES } from '@/types/destination'

export const metadata = { title: 'Табло — World Explorer' }

function EmptyChart({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{message}</p>
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <Auth />
  }

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('user_id', user.id)

  const destinations: Destination[] = data ?? []
  const stats = overviewStats(destinations)
  const years = visitsByYear(destinations)
  const types = typeDistribution(destinations)
  const countries = topCountries(destinations)
  const ratings = ratingDistribution(destinations)
  const hasRatings = ratings.some((count) => count > 0)

  return (
    <div className="flex h-full flex-col">
      <Header userEmail={user.email ?? ''} />

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl space-y-4 p-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              Статистиките не можаха да бъдат заредени. Опитайте отново по-късно.
            </p>
          )}

          {/* Гео колоните са празни, докато не се изпълнят миграцията и backfill-ът */}
          {stats.visitedCount > 0 && stats.countryCount === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Няма данни за държави. Изпълнете миграцията
              (database/migrations/001_add_location_columns.sql) и стартирайте
              „npm run backfill:location“ — вижте docs/IMPROVEMENTS.md.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile
              label="Дестинации"
              value={String(stats.total)}
              hint={`${stats.visitedCount} посетени · ${stats.plannedCount} планирани`}
            />
            <StatTile
              label="Държави"
              value={String(stats.countryCount)}
              hint={`${stats.worldPercent}% от света`}
            />
            <StatTile label="Континенти" value={String(stats.continentCount)} hint="от общо 7" />
            <StatTile
              label="Посещения"
              value={String(stats.totalVisits)}
              hint={`${stats.totalTravelDays} дни на път`}
            />
            <StatTile
              label="Средна оценка"
              value={stats.averageRating != null ? `${stats.averageRating} ★` : '—'}
            />
            <StatTile
              label="Снимки"
              value={String(stats.photoCount)}
              hint={`${stats.tagCount} тага`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Посещения по година">
              {years.length > 0 ? (
                <ColumnChart
                  items={years.map(({ year, count }) => ({
                    label: String(year),
                    value: count,
                    title: `${year} г.: ${count} посещения`,
                  }))}
                />
              ) : (
                <EmptyChart message="Добавете дати на посещенията, за да видите графиката." />
              )}
            </ChartCard>

            <ChartCard title="Топ държави">
              {countries.length > 0 ? (
                <BarList
                  items={countries.map((entry) => ({
                    key: entry.country_code,
                    label: entry.country,
                    value: entry.count,
                    icon: flagEmoji(entry.country_code),
                  }))}
                />
              ) : (
                <EmptyChart message="Няма посетени места с данни за държава." />
              )}
            </ChartCard>

            <ChartCard title="По тип място">
              {types.length > 0 ? (
                <BarList
                  items={types.map(({ type, count }) => ({
                    key: type,
                    label: DESTINATION_TYPES[type]?.label ?? type,
                    value: count,
                    icon: DESTINATION_TYPES[type]?.emoji,
                  }))}
                />
              ) : (
                <EmptyChart message="Все още няма дестинации." />
              )}
            </ChartCard>

            <ChartCard title="Разпределение на оценките">
              {hasRatings ? (
                <ColumnChart
                  items={ratings.map((count, index) => ({
                    label: `${index + 1} ★`,
                    value: count,
                    title: `Оценка ${index + 1}: ${count} дестинации`,
                  }))}
                />
              ) : (
                <EmptyChart message="Поставете оценки на посетените места." />
              )}
            </ChartCard>
          </div>
        </div>
      </main>

      <BottomNav current="dashboard" />
    </div>
  )
}
