# Database Setup Instructions

## 🚀 Стъпка 1: Supabase Setup

### 1. Регистрация в Supabase
- Отидете на [supabase.com](https://supabase.com)
- Създайте акаунт с GitHub/GitLab/Google
- Създайте нов проект: `world-explorer`

### 2. Вземете Credentials
- Отидете в **Settings** → **API**
- Копирайте:
  - **Project URL**
  - **anon public key**
  - **service_role key**

## 🔧 Стъпка 2: Environment Variables

### 1. Създайте .env.local файл:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (for Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### 2. Заменете placeholder стойностите:
- `your_supabase_project_url` → вашият Project URL
- `your_supabase_anon_key` → вашият anon key
- `your_supabase_service_role_key` → вашият service role key
- `[YOUR-PASSWORD]` → вашата база данни парола
- `[YOUR-PROJECT-REF]` → вашият project reference

## 🗄️ Стъпка 3: Database Schema

### 1. В Supabase Dashboard:
- Отидете в **SQL Editor**
- Копирайте и изпълнете SQL кода от `database/schema.sql`

### 2. Или използвайте Table Editor:
- Отидете в **Table Editor**
- Създайте нова таблица `destinations`
- Добавете колоните според схемата

## 🔐 Стъпка 4: Authentication Setup

### 1. В Supabase Dashboard:
- Отидете в **Authentication** → **Settings**
- Конфигурирайте провайдерите (Google, GitHub, etc.)

### 2. В Next.js приложението:
- Добавете провайдери в `lib/auth.ts`
- Създайте auth страници

## 🧪 Стъпка 5: Тестване

### 1. Стартирайте приложението:
```bash
npm run dev
```

### 2. Тествайте функционалността:
- Регистрирайте се
- Добавете дестинация
- Проверете дали се запазва в базата данни

## 📋 Checklist

- [ ] Регистриран в Supabase
- [ ] Създаден проект
- [ ] Копирани credentials
- [ ] Създаден .env.local файл
- [ ] Изпълнен SQL скрипт
- [ ] Конфигурирана автентикация
- [ ] Тествана функционалност

## 🔧 Troubleshooting

### Проблем: "Unauthorized" грешки
- Проверете дали credentials са правилни
- Проверете дали RLS политиките са активни

### Проблем: "Database connection failed"
- Проверете DATABASE_URL
- Проверете дали базата данни е достъпна

### Проблем: "Table not found"
- Изпълнете SQL скрипта отново
- Проверете дали таблицата е създадена

## 📚 Полезни линкове

- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs) 