-- Wedding fund: income and withdrawals (not wedding expenses)
CREATE TYPE fund_movement_type AS ENUM ('income', 'withdrawal');

CREATE TABLE fund_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type fund_movement_type NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT
);

CREATE INDEX idx_fund_movements_user_id ON fund_movements(user_id);
CREATE INDEX idx_fund_movements_date ON fund_movements(date DESC);

ALTER TABLE fund_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fund_movements_select" ON fund_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "fund_movements_insert" ON fund_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fund_movements_update" ON fund_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fund_movements_delete" ON fund_movements FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE fund_movements;
