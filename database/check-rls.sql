-- Проверка на RLS настройките за destinations таблицата

-- 1. Проверка дали RLS е включено
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'destinations';

-- 2. Проверка на policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'destinations';

-- 3. Временно изключване на RLS за тестване
-- ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;

-- 4. Създаване на policy за анонимен достъп (за тестване)
-- CREATE POLICY "Enable read access for all users" ON destinations
--     FOR SELECT USING (true);

-- 5. Включване на RLS отново
-- ALTER TABLE destinations ENABLE ROW LEVEL SECURITY; 