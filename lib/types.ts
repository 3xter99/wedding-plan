export type GuestStatus = "invited" | "confirmed" | "declined";

export type FundMovementType = "income" | "withdrawal";

export interface FundMovement {
  id: string;
  user_id: string;
  type: FundMovementType;
  title: string;
  amount: number;
  date: string;
  note: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  total_budget: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  deadline: string | null;
  completed: boolean;
}

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  price: number | null;
  category: string;
  date: string;
  purchased: boolean;
  expense_id: string | null;
}

export interface WeddingEvent {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Guest {
  id: string;
  user_id: string;
  event_id: string;
  name: string;
  status: GuestStatus;
}
