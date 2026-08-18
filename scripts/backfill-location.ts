// Еднократно попълване на географските колони (country, country_code, city,
// continent) за съществуващите дестинации чрез обратно геокодиране (Nominatim).
//
// Изисквания:
//   - изпълнена миграция database/migrations/001_add_location_columns.sql
//   - SUPABASE_SERVICE_ROLE_KEY (или SUPABASE_SECRET_KEY) в .env.local —
//     service ключът заобикаля RLS и обхожда записите на всички потребители
//
// Стартиране: npm run backfill:location
//
// Скриптът спазва лимита на Nominatim (1 заявка/сек) и е безопасен за
// повторно стартиране — обработва само записи без country_code.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { reverseGeocode } from '../lib/geo/geocode'

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {}
  let content: string
  try {
    content = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  } catch {
    return env
  }
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const env = { ...loadEnvLocal(), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    console.error(
      'Липсват NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY в .env.local.'
    )
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: rows, error } = await supabase
    .from('destinations')
    .select('id, name, latitude, longitude')
    .is('country_code', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Грешка при четене на дестинациите:', error.message)
    process.exit(1)
  }
  if (!rows || rows.length === 0) {
    console.log('Няма записи за попълване — всички дестинации имат гео данни.')
    return
  }

  console.log(`Записи за попълване: ${rows.length}`)
  let updated = 0
  let failed = 0

  for (const [index, row] of rows.entries()) {
    const location = await reverseGeocode(row.latitude, row.longitude, { timeoutMs: 10000 })

    if (!location || !location.country_code) {
      failed++
      console.warn(`  [${index + 1}/${rows.length}] „${row.name}“ — геокодирането не откри държава`)
    } else {
      const { error: updateError } = await supabase
        .from('destinations')
        .update({
          country: location.country,
          country_code: location.country_code,
          city: location.city,
          continent: location.continent,
        })
        .eq('id', row.id)

      if (updateError) {
        failed++
        console.warn(`  [${index + 1}/${rows.length}] „${row.name}“ — ${updateError.message}`)
      } else {
        updated++
        console.log(
          `  [${index + 1}/${rows.length}] „${row.name}“ → ${location.country ?? '?'} (${location.country_code})`
        )
      }
    }

    // Nominatim позволява най-много 1 заявка в секунда
    if (index < rows.length - 1) await sleep(1100)
  }

  console.log(`Готово: ${updated} обновени, ${failed} неуспешни.`)
  if (failed > 0) {
    console.log('Стартирайте скрипта отново, за да опита пак неуспешните записи.')
  }
}

main()
