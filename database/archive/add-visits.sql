-- Множество посещения на дестинация: колоната visits е JSONB масив от
-- обекти {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD" | null}.
-- Изпълнете в Supabase SQL Editor. Безопасно за повторно изпълнение.

ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS visits JSONB DEFAULT '[]';

-- Пренасяне на съществуващите единични дати като първо посещение
UPDATE public.destinations
SET visits = jsonb_build_array(jsonb_build_object('start', visit_date::text, 'end', NULL))
WHERE visit_date IS NOT NULL AND (visits IS NULL OR visits = '[]'::jsonb);

-- Почистване от предишната (неприложена) миграция, ако все пак е изпълнявана
ALTER TABLE public.destinations DROP CONSTRAINT IF EXISTS visit_period_valid;
ALTER TABLE public.destinations DROP COLUMN IF EXISTS visit_end_date;

-- Колоната visit_date остава временно, за да продължи да работи текущата
-- версия на приложението до деплоя на новата. След деплой по желание:
--   ALTER TABLE public.destinations DROP COLUMN IF EXISTS visit_date;
