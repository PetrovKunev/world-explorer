-- Създаване на таблицата destinations
CREATE TABLE destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('city', 'landmark', 'restaurant', 'hotel', 'museum', 'park', 'other')),
  visited BOOLEAN DEFAULT FALSE,
  visit_date DATE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  photos JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекси за бързо търсене
CREATE INDEX idx_destinations_user_id ON destinations(user_id);
CREATE INDEX idx_destinations_type ON destinations(type);
CREATE INDEX idx_destinations_visited ON destinations(visited);
CREATE INDEX idx_destinations_created_at ON destinations(created_at);

-- Row Level Security (RLS) - всеки потребител вижда само своите данни
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Политики за достъп
CREATE POLICY "Users can view own destinations" ON destinations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own destinations" ON destinations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own destinations" ON destinations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own destinations" ON destinations
  FOR DELETE USING (auth.uid() = user_id);

-- Функция за автоматично обновяване на updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер за автоматично обновяване
CREATE TRIGGER update_destinations_updated_at 
    BEFORE UPDATE ON destinations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 