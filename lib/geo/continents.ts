// Статично съответствие държава (ISO-3166-1 alpha-2) → континент.
// Без външно API — континентът се извежда локално от кода на държавата.

export type Continent =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'north-america'
  | 'south-america'
  | 'oceania'
  | 'antarctica'

export const CONTINENTS: Record<Continent, { label: string; emoji: string }> = {
  europe: { label: 'Европа', emoji: '🇪🇺' },
  asia: { label: 'Азия', emoji: '🌏' },
  africa: { label: 'Африка', emoji: '🌍' },
  'north-america': { label: 'Северна Америка', emoji: '🌎' },
  'south-america': { label: 'Южна Америка', emoji: '🌎' },
  oceania: { label: 'Океания', emoji: '🌏' },
  antarctica: { label: 'Антарктида', emoji: '🇦🇶' },
}

// Трансконтиненталните държави са отнесени към най-често използваната група:
// Русия → Европа, Турция/Грузия/Армения/Азербайджан/Казахстан → Азия,
// Кипър → Европа (член на ЕС). XK е широко използваният код за Косово.
const COUNTRY_CODES: Record<Continent, string> = {
  europe:
    'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU ' +
    'IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ ' +
    'SK SM UA VA XK',
  asia:
    'AE AF AM AZ BD BH BN BT CC CN CX GE HK ID IL IN IQ IR JO JP KG KH KP KR ' +
    'KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR ' +
    'TW UZ VN YE',
  africa:
    'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW IO ' +
    'KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ' +
    'ST SZ TD TG TN TZ UG YT ZA ZM ZW',
  'north-america':
    'AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY ' +
    'LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI',
  'south-america': 'AR BO BR CL CO EC FK GF GY PE PY SR UY VE',
  oceania:
    'AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU ' +
    'WF WS',
  antarctica: 'AQ BV GS HM TF',
}

const codeToContinent = new Map<string, Continent>()
for (const [continent, codes] of Object.entries(COUNTRY_CODES) as [Continent, string][]) {
  for (const code of codes.split(' ').filter(Boolean)) {
    codeToContinent.set(code, continent)
  }
}

// Общ брой държави и територии по континент — за progress индикаторите
export const CONTINENT_COUNTRY_COUNTS = Object.fromEntries(
  (Object.entries(COUNTRY_CODES) as [Continent, string][]).map(([continent, codes]) => [
    continent,
    codes.split(' ').filter(Boolean).length,
  ])
) as Record<Continent, number>

export function continentFor(countryCode: string | null | undefined): Continent | null {
  if (!countryCode) return null
  return codeToContinent.get(countryCode.toUpperCase()) ?? null
}

// Емоджи флаг от ISO кода (двойка regional indicator символи).
// На Windows се показва като букви — приемлив резервен вариант.
export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) return ''
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  )
}
