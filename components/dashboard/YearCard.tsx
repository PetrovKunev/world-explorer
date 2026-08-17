'use client'

// „Годината в равносметка“ — споделяема картичка 1080×1080 (за социални
// мрежи). Рисува се като SVG и се изтегля като PNG през canvas — без
// външни библиотеки. Дизайнът е фиксиран (тъмен), независим от темата.

import { useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { YearReview } from '@/lib/stats'
import { flagEmoji } from '@/lib/geo/continents'

const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif"

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export default function YearCard({ review }: { review: YearReview }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(false)

  const downloadPNG = () => {
    const svg = svgRef.current
    if (!svg) return
    setExporting(true)
    setError(false)

    const xml = new XMLSerializer().serializeToString(svg)
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
    const image = new Image()

    image.onload = () => {
      // 2× мащаб за отчетлив PNG
      const canvas = document.createElement('canvas')
      canvas.width = 2160
      canvas.height = 2160
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        setExporting(false)
        setError(true)
        return
      }
      context.drawImage(image, 0, 0, 2160, 2160)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        setExporting(false)
        if (!blob) {
          setError(true)
          return
        }
        const pngUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = pngUrl
        anchor.download = `world-explorer-${review.year}.png`
        anchor.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      setExporting(false)
      setError(true)
    }
    image.src = url
  }

  const stats: { value: string; label: string }[] = [
    {
      value: String(review.tripCount),
      label: plural(review.tripCount, 'пътуване', 'пътувания'),
    },
    {
      value: String(review.travelDays),
      label: plural(review.travelDays, 'ден на път', 'дни на път'),
    },
    {
      value: String(review.placeCount),
      label: plural(review.placeCount, 'посетено място', 'посетени места'),
    },
    {
      value: String(review.countryCodes.length),
      label:
        plural(review.countryCodes.length, 'държава', 'държави') +
        (review.newCountryCodes.length > 0 ? ` · ${review.newCountryCodes.length} нови` : ''),
    },
  ]

  const flags = review.countryCodes.map(flagEmoji).filter(Boolean).join(' ')

  return (
    <div className="space-y-3">
      <svg
        ref={svgRef}
        viewBox="0 0 1080 1080"
        role="img"
        aria-label={`Годината в равносметка — ${review.year}`}
        className="w-full max-w-lg rounded-2xl shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="year-card-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e40af" />
            <stop offset="1" stopColor="#0b1120" />
          </linearGradient>
        </defs>

        <rect width="1080" height="1080" fill="url(#year-card-bg)" />
        {/* Декоративни кръгове като „орбити“ */}
        <circle cx="900" cy="140" r="220" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <circle cx="900" cy="140" r="320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <circle cx="120" cy="1000" r="260" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

        <text x="540" y="150" textAnchor="middle" fontFamily={FONT} fontSize="34" letterSpacing="10" fill="rgba(255,255,255,0.65)">
          WORLD EXPLORER
        </text>
        <text x="540" y="360" textAnchor="middle" fontFamily={FONT} fontSize="230" fontWeight="700" fill="#ffffff">
          {review.year}
        </text>
        <text x="540" y="430" textAnchor="middle" fontFamily={FONT} fontSize="42" fill="rgba(255,255,255,0.8)">
          Годината в равносметка
        </text>

        {stats.map((stat, index) => {
          const x = index % 2 === 0 ? 300 : 780
          const y = index < 2 ? 580 : 760
          return (
            <g key={stat.label}>
              <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontSize="88" fontWeight="700" fill="#ffffff">
                {stat.value}
              </text>
              <text x={x} y={y + 52} textAnchor="middle" fontFamily={FONT} fontSize="32" fill="rgba(255,255,255,0.65)">
                {stat.label}
              </text>
            </g>
          )
        })}

        {flags && (
          <text x="540" y="905" textAnchor="middle" fontFamily={FONT} fontSize="44">
            {flags}
          </text>
        )}

        {review.topCountry && (
          <text x="540" y="975" textAnchor="middle" fontFamily={FONT} fontSize="34" fill="rgba(255,255,255,0.8)">
            {`Топ държава: ${review.topCountry.country} (${review.topCountry.count} ${plural(review.topCountry.count, 'място', 'места')})`}
          </text>
        )}
        {review.longestTrip && (
          <text x="540" y="1025" textAnchor="middle" fontFamily={FONT} fontSize="34" fill="rgba(255,255,255,0.8)">
            {`Най-дълго пътуване: ${review.longestTrip.days} ${plural(review.longestTrip.days, 'ден', 'дни')}`}
          </text>
        )}
      </svg>

      <div className="flex items-center gap-3">
        <button
          onClick={downloadPNG}
          disabled={exporting}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span>Изтегли като PNG</span>
        </button>
        {error && (
          <p className="text-sm text-red-700 dark:text-red-400">
            Експортът не сполучи. Опитайте отново.
          </p>
        )}
      </div>
    </div>
  )
}
