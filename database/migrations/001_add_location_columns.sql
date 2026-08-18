-- Географски колони за статистиките: държава, ISO код, град и континент.
-- Попълват се автоматично от приложението при създаване и местене на
-- дестинация; за съществуващите записи вижте scripts/backfill-location.ts.
-- Изпълнете в Supabase SQL Editor. Безопасно за повторно изпълнение.

ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS country_code CHAR(2);
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS continent TEXT;

-- Статистиките групират по държава — индексът пази заявките бързи
CREATE INDEX IF NOT EXISTS idx_destinations_country_code
  ON public.destinations(country_code);
