-- Migration за увеличаване точността на координатите
-- Проблем: DECIMAL(11,8) и DECIMAL(12,8) дават точност само до ~11 метра
-- Решение: DECIMAL(12,10) и DECIMAL(13,10) дават точност до ~1.1 сантиметра

-- Увеличаваме точността на latitude колоната
ALTER TABLE destinations 
ALTER COLUMN latitude TYPE DECIMAL(12, 10);

-- Увеличаваме точността на longitude колоната  
ALTER TABLE destinations 
ALTER COLUMN longitude TYPE DECIMAL(13, 10);

-- Проверка на промените
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'destinations' 
AND column_name IN ('latitude', 'longitude');