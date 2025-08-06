-- Проверка и поправка на CORS настройките
-- Изпълнете това в Supabase SQL Editor

-- 1. Проверка на текущите настройки
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%cors%' OR name LIKE '%allowed%';

-- 2. Проверка на RLS статуса
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'destinations';

-- 3. Временно изключване на RLS (ако все още е включено)
-- ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;

-- 4. Създаване на policy за анонимен достъп
-- DROP POLICY IF EXISTS "Enable read access for all users" ON destinations;
-- CREATE POLICY "Enable read access for all users" ON destinations
--     FOR SELECT USING (true);

-- 5. Проверка на policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'destinations'; 