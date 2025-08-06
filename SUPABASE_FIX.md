# 🔧 Поправка на Supabase настройките

## 🎯 **Проблемът:**
- ✅ Мрежата работи
- ✅ Прост fetch работи
- ❌ Supabase не работи

## 🛠️ **Стъпки за поправка:**

### **1. Отидете в Supabase Dashboard:**
https://supabase.com/dashboard/project/bflpybciorqdibqrxsej

### **2. Проверете Authentication настройките:**
1. **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3000`
3. **Redirect URLs:** Добавете:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000`

### **3. Проверете API настройките:**
1. **Settings** → **API**
2. **Project URL:** `https://bflpybciorqdibqrxsej.supabase.co`
3. **anon public key:** Проверете дали е правилен

### **4. Изключете RLS временно:**
1. **SQL Editor** → Изпълнете:
```sql
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;
```

### **5. Проверете CORS настройките:**
1. **Settings** → **API**
2. **CORS Origins:** Добавете:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`

## 🎯 **След поправката:**
Ще се върнем към нормалното приложение без тестови страници. 