# World Explorer — интерактивна карта на пътуванията

Уеб приложение за проследяване на вашите дестинации по света: отбелязвайте посетени и планирани места върху интерактивна карта, добавяйте бележки, оценки, дати и тагове.

## 🌍 Функции

- **Интерактивна карта** (Leaflet + OpenStreetMap) — кликнете където и да е, за да добавите дестинация
- **Търсене на място по име** — геокодиране чрез OpenStreetMap Nominatim
- **Влачене на маркери** — коригирайте местоположението директно върху картата
- **Типове дестинации** — град, забележителност, ресторант, хотел, музей, парк и други
- **Детайли** — бележки, оценка 1–5, дата на посещение, тагове
- **Търсене и филтриране** в списъка с дестинации
- **Акаунти** — всеки потребител вижда само своите дестинации (Supabase Auth + RLS)
- **Изцяло на български**, отзивчив дизайн за мобилни устройства

## 🛠️ Технологии

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Leaflet / React Leaflet 5**
- **Supabase** — автентикация и PostgreSQL с Row Level Security, интегрирани чрез `@supabase/ssr` (сървърно рендиране на данните)

## 🚀 Стартиране

### Изисквания

- Node.js 20.9+
- Supabase проект (безплатният план е достатъчен)

### Инсталация

1. Клонирайте репозиторито и инсталирайте зависимостите:

   ```bash
   git clone <repository-url>
   cd world-explorer
   npm install
   ```

2. Създайте `.env.local` по примера на `env.example`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
   NEXT_CARTO_API_KEY=<carto-basemaps-key>
   ```

   Картата е CARTO Voyager, а CARTO изисква ключ — безплатен за некомерсиална употреба (до 5 млн. tile-а на месец) от [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey/). Без него tile-овете идват с воден знак „API KEY REQUIRED“. Ключът се вижда в браузъра, затова в таблото на CARTO го ограничете до домейна на сайта (Referer). Във Vercel го добавете в Environment Variables и направете нов deploy — ключът се вгражда в кода при build.

3. Създайте таблицата и RLS политиките — изпълнете `database/schema.sql` в Supabase SQL Editor.

4. Стартирайте development сървъра:

   ```bash
   npm run dev
   ```

   и отворете [http://localhost:3000](http://localhost:3000).

### Защита от паузиране на Supabase

Безплатният план на Supabase паузира проекта след 7 дни без активност. `vercel.json` пуска Vercel Cron веднъж дневно към `/api/keep-alive`, който прави лека заявка към базата.

За да работи в production, добавете в Vercel → Settings → Environment Variables `CRON_SECRET` (дълъг случаен низ, напр. `openssl rand -hex 32`) и направете нов deploy. Без него endpoint-ът връща 401 и ping-ът не минава. Изпълненията се виждат в Vercel → Settings → Cron Jobs, а грешките — в Logs.

## 📁 Структура

```
world-explorer/
├── app/
│   ├── layout.tsx          # Основен layout (шрифт, метаданни, footer)
│   ├── page.tsx            # Server Component — auth проверка + зареждане на данните
│   └── globals.css         # Tailwind 4 конфигурация и глобални стилове
├── components/
│   ├── AppShell.tsx        # Клиентска обвивка (header, sidebar, карта, toast-ове)
│   ├── Auth.tsx            # Вход / регистрация
│   ├── MapComponent.tsx    # Карта, маркери, търсене на място, диалог за добавяне
│   ├── Sidebar.tsx         # Списък с дестинации, търсене, филтри
│   ├── DestinationCard.tsx # Картичка на дестинация
│   ├── DestinationForm.tsx # Форма за добавяне/редакция
│   ├── ConfirmDialog.tsx   # Потвърждение за изтриване
│   └── Toaster.tsx         # Toast известия
├── hooks/
│   └── useDestinations.ts  # CRUD с оптимистични обновявания
├── lib/supabase/
│   ├── client.ts           # Браузърен Supabase клиент
│   └── server.ts           # Сървърен Supabase клиент (cookies)
├── proxy.ts                # Опресняване на Supabase сесията при всяка заявка
├── types/destination.ts    # Типове и етикети на дестинациите
└── database/               # SQL скриптове — вижте database/README.md
```

## 🔧 Скриптове

- `npm run dev` — development сървър
- `npm run build` — production build
- `npm run start` — production сървър
- `npm run lint` — ESLint

## 📄 Лиценз

MIT — вижте файла LICENSE.
