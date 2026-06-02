# Свадебный планировщик

Веб-приложение для пары: общий бюджет, расходы, задачи, список покупок и гости. Данные синхронизируются в реальном времени через Supabase Realtime.

**Стек:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), Recharts.

## Быстрый старт (локально)

```bash
npm install
cp .env.local.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Настройка Supabase

### 1. Создайте проект

1. [supabase.com](https://supabase.com) → **New project**
2. Сохраните **Project URL** и **anon public** key (Settings → API)

### 2. Выполните SQL

В **SQL Editor** вставьте и выполните содержимое файла:

`supabase/migrations/20250602000000_initial_schema.sql`

Скрипт создаёт таблицы, RLS-политики и подключает таблицы к Realtime.

### 3. Realtime

В Dashboard: **Database → Replication** — убедитесь, что включены таблицы `budget`, `expenses`, `tasks`, `shopping_items`, `guests` (миграция добавляет их в publication `supabase_realtime`).

### 4. Аутентификация

**Authentication → Providers → Email** — включите Email.

Для двух аккаунтов без подтверждения почты (удобно для пары):

- **Authentication → Providers → Email** → отключите **Confirm email**

Либо зарегистрируйте оба аккаунта и подтвердите email по ссылкам.

### 5. RLS — «оба видят всё»

Политики разрешают любому **авторизованному** пользователю:

- **SELECT** — все строки всех пользователей
- **INSERT** — только со своим `user_id`
- **UPDATE/DELETE** — любые строки (общее редактирование)

Используйте **только два** аккаунта (вы и супруга). Не публикуйте ссылку на регистрацию посторонним.

### 6. Переменные окружения

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## Деплой на Vercel

1. Залейте репозиторий на GitHub/GitLab
2. [vercel.com](https://vercel.com) → **Import Project**
3. **Environment Variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |

4. Deploy

### Auth redirect (опционально)

В Supabase: **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

## Структура проекта

```
app/
  layout.tsx          # SupabaseProvider
  page.tsx            # редирект login / dashboard
  login/page.tsx
  dashboard/page.tsx
  auth/callback/route.ts
components/
  BudgetPanel.tsx
  TasksPanel.tsx
  ShoppingPanel.tsx
  GuestsPanel.tsx
  DashboardTabs.tsx
  DashboardClient.tsx
lib/
  supabaseClient.ts
  supabaseServer.ts
  supabaseMiddleware.ts
  useRealtimeTable.ts
middleware.ts
supabase/migrations/
```

## Модули

| Модуль | Описание |
|--------|----------|
| **Бюджет** | Общий бюджет, расходы по категориям, остаток, прогресс-бар, круговая диаграмма (Recharts) |
| **Задачи** | Дедлайны, фильтр все/активные/выполненные, сортировка по дате |
| **Покупки** | Отдельный список; сумма купленного, всего в списке, осталось купить |
| **Гости** | Статусы invited / confirmed / declined, счётчики |

Изменения у одного пользователя сразу видны второму через **Supabase Realtime** (`postgres_changes`).

## Скрипт SQL (краткая справка)

Таблицы: `budget`, `expenses`, `tasks`, `shopping_items`, `guests` + enum `guest_status`.

Полный скрипт — в `supabase/migrations/20250602000000_initial_schema.sql`.

## Лицензия

MIT
