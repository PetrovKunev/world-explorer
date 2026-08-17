import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Auth from '@/components/Auth'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import YearCard from '@/components/dashboard/YearCard'
import TripsTable from '@/components/dashboard/TripsTable'
import ChartCard from '@/components/dashboard/ChartCard'
import { trips, tripsByYear, yearInReview } from '@/lib/stats'
import { Destination } from '@/types/destination'

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `${year} в равносметка — World Explorer` }
}

export default async function YearReviewPage({
  params,
}: {
  params: Promise<{ year: string }>
}) {
  const { year: yearParam } = await params
  if (!/^\d{4}$/.test(yearParam)) notFound()
  const year = Number(yearParam)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <Auth />
  }

  const { data } = await supabase.from('destinations').select('*').eq('user_id', user.id)

  const destinations: Destination[] = data ?? []
  const review = yearInReview(destinations, year)
  const yearTrips = trips(destinations).filter(
    (trip) => Number(trip.start.slice(0, 4)) === year
  )
  const otherYears = tripsByYear(destinations)
    .filter((entry) => entry.count > 0 && entry.year !== year)
    .map((entry) => entry.year)

  return (
    <div className="flex h-full flex-col">
      <Header userEmail={user.email ?? ''} />

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Обратно към таблото</span>
            </Link>
            {otherYears.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Други години:{' '}
                {otherYears.map((otherYear, index) => (
                  <span key={otherYear}>
                    {index > 0 && ' · '}
                    <Link
                      href={`/dashboard/${otherYear}`}
                      className="text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {otherYear}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>

          {review.tripCount === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              Няма пътувания през {year} г. Добавете дати на посещенията, за да се
              появи равносметката.
            </p>
          ) : (
            <>
              <YearCard review={review} />

              <ChartCard
                title={`Пътуванията през ${year} г.`}
                description="Период, продължителност, брой места и държави."
              >
                <TripsTable trips={yearTrips} />
              </ChartCard>
            </>
          )}
        </div>
      </main>

      <BottomNav current="dashboard" />
    </div>
  )
}
