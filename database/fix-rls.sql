-- Временно изключване на RLS за тестване
-- Изпълнете това в Supabase SQL Editor

-- 1. Изключваме RLS временно
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;

-- 2. Проверяваме дали е изключено
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'destinations';

-- 3. Тестваме достъпа
-- SELECT * FROM destinations LIMIT 1; 