import L from 'leaflet'

// Пинчета като „забодени в коркова карта“: лъскава глава с отблясък,
// метална игла и сянка при върха. Върхът на иглата е гео-точката.
// Дублираните SVG дефиниции с еднакво id са безопасни — сочат едно и също.
const PIN_COLORS = {
  visited: { light: '#8df0c0', base: '#10b981', dark: '#047857' },
  planned: { light: '#ffcf9e', base: '#f97316', dark: '#b45309' },
  draft: { light: '#fca5a5', base: '#ef4444', dark: '#b91c1c' },
} as const

function pushpinSvg(colorKey: keyof typeof PIN_COLORS, tilt: number): string {
  const color = PIN_COLORS[colorKey]
  return `
    <svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wx-pin-${colorKey}" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="${color.light}"/>
          <stop offset="55%" stop-color="${color.base}"/>
          <stop offset="100%" stop-color="${color.dark}"/>
        </radialGradient>
        <linearGradient id="wx-pin-needle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#e5e7eb"/>
          <stop offset="50%" stop-color="#9ca3af"/>
          <stop offset="100%" stop-color="#4b5563"/>
        </linearGradient>
      </defs>
      <ellipse cx="19" cy="44" rx="5.5" ry="2" fill="rgba(40,20,0,0.3)"/>
      <g transform="rotate(${tilt} 19 44)">
        <polygon points="17.8,21 20.2,21 19,44" fill="url(#wx-pin-needle)"/>
        <ellipse cx="19" cy="20.5" rx="3.5" ry="1.5" fill="#374151"/>
        <circle cx="19" cy="12" r="9.5" fill="url(#wx-pin-${colorKey})"/>
        <ellipse cx="15.5" cy="8" rx="3.2" ry="2.2" fill="rgba(255,255,255,0.55)"
          transform="rotate(-25 15.5 8)"/>
      </g>
    </svg>
  `
}

// Иконите се кешират по статус и наклон — иначе всеки render създава
// нови L.DivIcon обекти и Leaflet пресъздава маркерите
const iconCache = new Map<string, L.DivIcon>()

export function getMarkerIcon(visited: boolean, tilt: number): L.DivIcon {
  const colorKey = visited ? 'visited' : 'planned'
  const key = `${colorKey}-${tilt}`
  const cached = iconCache.get(key)
  if (cached) return cached

  const icon = L.divIcon({
    html: pushpinSvg(colorKey, tilt),
    className: 'destination-marker',
    iconSize: [38, 48],
    iconAnchor: [19, 44],
  })

  iconCache.set(key, icon)
  return icon
}

// Лек детерминиран наклон (−16°…16°) от id-то — като истински пинчета,
// но стабилен между render-ите
export function pinTilt(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 33) - 16
}

export const tempMarkerIcon = L.divIcon({
  html: pushpinSvg('draft', 0),
  className: 'temp-marker',
  iconSize: [38, 48],
  iconAnchor: [19, 44],
})

// Клъстер: „бележка с число, забодена с мини пинче“
export function clusterIcon(cluster: { getChildCount(): number }): L.DivIcon {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `
      <svg width="48" height="44" viewBox="0 0 48 44" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="wx-cluster-pin" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#ffcf9e"/>
            <stop offset="55%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#b45309"/>
          </radialGradient>
        </defs>
        <g transform="rotate(-4 24 26)">
          <rect x="6" y="13" width="36" height="26" rx="4" fill="#fdf6e3"
            stroke="rgba(120,90,50,0.45)"/>
          <text x="24" y="31" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="13" font-weight="700"
            fill="#3d2d1a">${count}</text>
        </g>
        <ellipse cx="24" cy="15" rx="3" ry="1.2" fill="rgba(40,20,0,0.25)"/>
        <circle cx="24" cy="10" r="5.5" fill="url(#wx-cluster-pin)"/>
        <ellipse cx="22" cy="8" rx="1.8" ry="1.3" fill="rgba(255,255,255,0.55)"/>
      </svg>
    `,
    className: 'cluster-note',
    iconSize: [48, 44],
    iconAnchor: [24, 26],
  })
}

// Син пулсиращ маркер за текущото местоположение на потребителя
export const userLocationIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 18px; height: 18px;">
      <div class="user-location-pulse" style="
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background-color: rgba(59, 130, 246, 0.3);
      "></div>
      <div style="
        position: absolute;
        inset: 0;
        background-color: #3B82F6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
