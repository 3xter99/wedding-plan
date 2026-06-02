-- Link shopping items to budget expenses
ALTER TABLE shopping_items
  ADD COLUMN category TEXT NOT NULL DEFAULT 'Прочее',
  ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

CREATE INDEX idx_shopping_items_expense_id ON shopping_items(expense_id);
