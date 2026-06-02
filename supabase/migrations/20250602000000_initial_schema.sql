-- Wedding Planner: tables, RLS, Realtime
-- Run in Supabase SQL Editor or via: supabase db push

-- Guest status enum
CREATE TYPE guest_status AS ENUM ('invited', 'confirmed', 'declined');

-- Budget (one row per user who set it; both users see all)
CREATE TABLE budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Прочее',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline DATE,
  completed BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 2),
  purchased BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status guest_status NOT NULL DEFAULT 'invited'
);

-- Indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX idx_guests_user_id ON guests(user_id);
CREATE INDEX idx_budget_user_id ON budget(user_id);

-- RLS
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Both authenticated users see and manage all rows (couple shared planner)
-- INSERT: only own user_id; SELECT/UPDATE/DELETE: any authenticated user

CREATE POLICY "budget_select" ON budget FOR SELECT TO authenticated USING (true);
CREATE POLICY "budget_insert" ON budget FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_update" ON budget FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "budget_delete" ON budget FOR DELETE TO authenticated USING (true);

CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "shopping_select" ON shopping_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "guests_select" ON guests FOR SELECT TO authenticated USING (true);
CREATE POLICY "guests_insert" ON guests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guests_update" ON guests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "guests_delete" ON guests FOR DELETE TO authenticated USING (true);

-- Realtime (enable in Dashboard → Database → Replication if needed)
ALTER PUBLICATION supabase_realtime ADD TABLE budget;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
