-- Обновяване на типовете данни за координатите
-- Този скрипт трябва да се изпълни в Supabase SQL Editor

-- Първо проверяваме дали таблицата съществува
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'destinations') THEN
        -- Обновяваме типовете данни за координатите
        ALTER TABLE destinations 
        ALTER COLUMN latitude TYPE DECIMAL(11, 8),
        ALTER COLUMN longitude TYPE DECIMAL(12, 8);
        
        RAISE NOTICE 'Coordinates data types updated successfully';
    ELSE
        RAISE NOTICE 'Table destinations does not exist';
    END IF;
END $$; 