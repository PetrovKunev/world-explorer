-- Период на посещение: visit_date става начална дата, visit_end_date е
-- крайната (NULL при еднодневно посещение). Изпълнете в Supabase SQL Editor.
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS visit_end_date DATE;

-- Крайната дата не може да е преди началната
ALTER TABLE destinations
  ADD CONSTRAINT visit_period_valid
  CHECK (visit_end_date IS NULL OR visit_date IS NULL OR visit_end_date >= visit_date);
