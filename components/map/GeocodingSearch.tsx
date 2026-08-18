'use client'

import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface GeocodeResult {
  display_name: string
  name?: string
  lat: string
  lon: string
}

// Търсене на място по име (Nominatim през /api/geocode)
export default function GeocodingSearch({
  onSelect,
}: {
  onSelect: (result: { lat: number; lng: number; name: string }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = (q: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)

    // През /api/geocode — правилен User-Agent към Nominatim + кеш
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GeocodeResult[]) => {
        setResults(data)
        setOpen(true)
        setSearching(false)
      })
      .catch(() => {
        // Прекъсната или неуспешна заявка — не показваме грешка при търсене
        if (!controller.signal.aborted) setSearching(false)
      })
  }

  const handleChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => runSearch(value.trim()), 400)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="absolute left-14 right-4 top-4 z-[1000] sm:right-auto sm:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Търсене на място…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm shadow-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
            aria-label="Изчисти търсенето"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {searching ? 'Търсене…' : 'Няма намерени резултати'}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lon}-${index}`}
                onClick={() => {
                  onSelect({
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    name: result.name || result.display_name.split(',')[0],
                  })
                  clear()
                }}
                className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                title={result.display_name}
              >
                {result.display_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
