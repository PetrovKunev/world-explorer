# 🔧 Поправка на CORS проблема

## 🎯 **Проблемът:**
- ✅ Auth работи
- ❌ Direct Fetch не работи (CORS)
- ❌ Supabase Client не работи (CORS)

## 🛠️ **Стъпки за поправка:**

### **1. Проверете Site URL в Supabase Dashboard:**

1. **Отидете в:** https://supabase.com/dashboard/project/bflpybciorqdbirqxsj
2. **Навигирайте до:** Authentication → URL Configuration
3. **Проверете Site URL:**
   - Трябва да е: `http://localhost:3000` (за development)
   - Или: `http://localhost:8080` (за CORS теста)

### **2. Добавете всички необходими URLs:**

```
Site URL: http://localhost:3000
Redirect URLs: 
- http://localhost:3000
- http://localhost:8080
- http://127.0.0.1:3000
- http://127.0.0.1:8080
```

### **3. Проверете CORS настройките:**

1. **Отидете в:** Settings → API
2. **Проверете:** "Enable Row Level Security (RLS)"
3. **Ако е включено:** Временно го изключете за тестване

### **4. Изпълнете SQL команди:**

```sql
-- Временно изключване на RLS
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;

-- Проверка на резултата
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'destinations';
```

### **5. Тествайте отново:**

1. **Обновете CORS теста:** http://localhost:8080
2. **Кликнете "Test Direct Fetch"**
3. **Трябва да работи!**

## 🎯 **Очакван резултат:**
- ✅ Всички тестове ще са зелени
- ✅ "Direct fetch successful"
- ✅ "Supabase client successful"

## 🔒 **За production:**
След като работи, ще включим RLS отново с правилни policies. 