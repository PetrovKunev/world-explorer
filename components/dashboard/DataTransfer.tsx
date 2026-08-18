'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toCSV, toGeoJSON, toGPX, toJSON, parseImport } from '@/lib/export'
import { Destination, DestinationInput } from '@/types/destination'

interface DataTransferProps {
  userId: string
  destinations: Destination[]
}

const buttonClass =
  'inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'

function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function DataTransfer({ userId, destinations }: DataTransferProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ records: DestinationInput[]; skipped: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const exports = [
    { label: 'JSON', build: toJSON, ext: 'json', mime: 'application/json' },
    { label: 'CSV', build: toCSV, ext: 'csv', mime: 'text/csv' },
    { label: 'GeoJSON', build: toGeoJSON, ext: 'geojson', mime: 'application/geo+json' },
    { label: 'GPX', build: toGPX, ext: 'gpx', mime: 'application/gpx+xml' },
  ]

  const handleFile = async (file: File) => {
    setMessage(null)
    const parsed = parseImport(await file.text())
    if (parsed.records.length === 0) {
      setMessage({
        kind: 'error',
        text: 'Файлът не съдържа валидни дестинации. Използвайте JSON експорт от приложението.',
      })
      return
    }
    setPending(parsed)
  }

  const confirmImport = async () => {
    if (!pending) return
    setImporting(true)
    const { error } = await supabase
      .from('destinations')
      .insert(pending.records.map((record) => ({ ...record, user_id: userId })))
    setImporting(false)
    setPending(null)
    if (error) {
      setMessage({ kind: 'error', text: 'Импортът не сполучи. Опитайте отново.' })
      return
    }
    setMessage({ kind: 'success', text: `Добавени са ${pending.records.length} дестинации.` })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {exports.map(({ label, build, ext, mime }) => (
          <button
            key={ext}
            onClick={() => download(`world-explorer-${today}.${ext}`, build(destinations), mime)}
            className={buttonClass}
          >
            <Download className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}

        <span className="mx-1 hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-700" />

        <button onClick={() => fileInputRef.current?.click()} className={buttonClass}>
          <Upload className="h-4 w-4" />
          <span>Импорт от JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {pending && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
          <span>
            Ще бъдат добавени {pending.records.length} дестинации без снимките
            {pending.skipped > 0 && ` (${pending.skipped} пропуснати като невалидни)`}. Продължаваме?
          </span>
          <button
            onClick={confirmImport}
            disabled={importing}
            className="inline-flex items-center space-x-1 rounded-lg bg-primary-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Добави</span>
          </button>
          <button
            onClick={() => setPending(null)}
            disabled={importing}
            className="rounded-lg px-3 py-1 text-sm text-primary-700 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900"
          >
            Отказ
          </button>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.kind === 'success'
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
