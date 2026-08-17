import { createClient } from '@/lib/supabase/server'
import Auth from '@/components/Auth'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import StatTile from '@/components/dashboard/StatTile'
import ChartCard from '@/components/dashboard/ChartCard'
import ColumnChart from '@/components/dashboard/ColumnChart'
import BarList from '@/components/dashboard/BarList'
import ProgressList from '@/components/dashboard/ProgressList'
import TripsTable, { formatTripPeriod } from '@/components/dashboard/TripsTable'
import CountriesTable from '@/components/dashboard/CountriesTable'
import {
  continentProgress,
  countrySummary,
  extremePoints,
  longestTrip,
  mostActiveYear,
  overviewStats,
  ratingDistribution,
  topCountries,
  topRatedPlaces,
  trips,
  tripsByMonth,
  tripsByYear,
  typeDistribution,
} from '@/lib/stats'
import { badges } from '@/lib/badges'
import BadgeGrid from '@/components/dashboard/BadgeGrid'
import { CONTINENTS, flagEmoji } from '@/lib/geo/continents'
import { Destination, DESTINATION_TYPES } from '@/types/destination'

export const metadata = { title: 'Табло — World Explorer' }

const MONTH_LABELS = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек']

function EmptyChart({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{message}</p>
}

function RecordRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}
        {hint && (
          <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">({hint})</span>
        )}
      </dd>
    </div>
  )
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
  const years = tripsByYear(destinations)
  const months = tripsByMonth(destinations)
  const types = typeDistribution(destinations)
  const countries = topCountries(destinations)
  const ratings = ratingDistribution(destinations)
  const continents = continentProgress(destinations)
  const allTrips = trips(destinations)
  const countryRows = countrySummary(destinations)
  const longest = longestTrip(destinations)
  const activeYear = mostActiveYear(destinations)
  const extremes = extremePoints(destinations)
  const favorites = topRatedPlaces(destinations)
  const allBadges = badges(destinations)
  const earnedCount = allBadges.filter((badge) => badge.earned).length
  const hasRatings = ratings.some((count) => count > 0)
  const hasMonths = months.some((count) => count > 0)

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
              label="Пътувания"
              value={String(stats.tripCount)}
              hint={`${stats.travelDays} дни на път`}
              title="Отбелязани посещения със застъпващи се или последователни дати се броят като едно пътуване, независимо колко места обхващат. Дните на път са без двойно броене."
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
            <ChartCard
              title="Пътувания по година"
              description="Посещения на близки дати се броят като едно пътуване, колкото и места да включва."
            >
              {years.length > 0 ? (
                <ColumnChart
                  items={years.map(({ year, count }) => ({
                    label: String(year),
                    value: count,
                    title: `${year} г.: ${count} ${count === 1 ? 'пътуване' : 'пътувания'}`,
                  }))}
                />
              ) : (
                <EmptyChart message="Добавете дати на посещенията, за да видите графиката." />
              )}
            </ChartCard>

            <ChartCard
              title="Пътувания по месеци"
              description="В кой месец от годината тръгвате на път — сумарно за всички години."
            >
              {hasMonths ? (
                <ColumnChart
                  items={months.map((count, index) => ({
                    label: MONTH_LABELS[index],
                    value: count,
                    title: `${MONTH_LABELS[index]}: ${count} ${count === 1 ? 'пътуване' : 'пътувания'}`,
                  }))}
                />
              ) : (
                <EmptyChart message="Добавете дати на посещенията, за да видите графиката." />
              )}
            </ChartCard>

            <ChartCard title="Топ държави" description="Посетени места по държава.">
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

            <ChartCard
              title="Континенти"
              description="Посетени държави от всички държави и територии на континента."
            >
              {continents.length > 0 ? (
                <ProgressList
                  items={continents.map((entry) => ({
                    key: entry.continent,
                    label: CONTINENTS[entry.continent].label,
                    value: entry.visitedCountries,
                    total: entry.totalCountries,
                  }))}
                />
              ) : (
                <EmptyChart message="Няма посетени места с данни за континент." />
              )}
            </ChartCard>

            <ChartCard title="По тип място" description="Всички дестинации, вкл. планираните.">
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

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Рекорди">
              {longest || activeYear || extremes ? (
                <dl className="space-y-3">
                  {longest && (
                    <RecordRow
                      label="Най-дълго пътуване"
                      value={`${longest.days} дни`}
                      hint={formatTripPeriod(longest)}
                    />
                  )}
                  {activeYear && (
                    <RecordRow
                      label="Най-активна година"
                      value={String(activeYear.year)}
                      hint={`${activeYear.count} ${activeYear.count === 1 ? 'пътуване' : 'пътувания'}`}
                    />
                  )}
                  {extremes && (
                    <>
                      <RecordRow label="Най на север" value={extremes.north.name} />
                      <RecordRow label="Най на юг" value={extremes.south.name} />
                      <RecordRow label="Най на изток" value={extremes.east.name} />
                      <RecordRow label="Най на запад" value={extremes.west.name} />
                    </>
                  )}
                </dl>
              ) : (
                <EmptyChart message="Рекордите се появяват с първите посетени места." />
              )}
            </ChartCard>

            <ChartCard title="Топ 5 любими места" description="Най-високо оценените посетени места.">
              {favorites.length > 0 ? (
                <ol className="space-y-2.5">
                  {favorites.map((dest, index) => (
                    <li key={dest.id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 shrink-0 text-right tabular-nums text-gray-400 dark:text-gray-500">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 truncate text-gray-900 dark:text-gray-100">
                        <span className="mr-1.5">
                          {DESTINATION_TYPES[dest.type]?.emoji ?? '📍'}
                        </span>
                        {dest.name}
                        {dest.country_code && (
                          <span className="ml-1.5">{flagEmoji(dest.country_code)}</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
                        {dest.rating} ★
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyChart message="Поставете оценки на посетените места." />
              )}
            </ChartCard>
          </div>

          <ChartCard
            title={`Постижения (${earnedCount}/${allBadges.length})`}
            description="Значките се отключват автоматично с напредъка на колекцията."
          >
            <BadgeGrid badges={allBadges} />
          </ChartCard>

          <ChartCard
            title="Справка: пътувания"
            description="Всяко пътуване с продължителност, брой места и държави."
          >
            {allTrips.length > 0 ? (
              <TripsTable trips={allTrips} />
            ) : (
              <EmptyChart message="Добавете дати на посещенията, за да се появят пътуванията." />
            )}
          </ChartCard>

          <ChartCard
            title="Справка: по държави"
            description="Всички дестинации по държави — вкл. планираните."
          >
            {countryRows.length > 0 ? (
              <CountriesTable rows={countryRows} />
            ) : (
              <EmptyChart message="Няма дестинации с данни за държава." />
            )}
          </ChartCard>
        </div>
      </main>

      <BottomNav current="dashboard" />
    </div>
  )
}
