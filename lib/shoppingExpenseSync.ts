import type { SupabaseClient } from "@supabase/supabase-js";

type ShoppingRow = {
  id: string;
  user_id: string;
  name: string;
  price: number | null;
  category: string;
  date: string;
  expense_id: string | null;
};

export async function createExpenseForItem(
  supabase: SupabaseClient,
  userId: string,
  item: Pick<ShoppingRow, "name" | "price" | "category" | "date">
) {
  const amount = Number(item.price);
  if (item.price == null || isNaN(amount) || amount <= 0) {
    return { error: "Укажите сумму, чтобы отметить покупку" as const };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      title: item.name,
      category: item.category || "Прочее",
      amount,
      date: item.date,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { expense_id: data.id as string };
}

export async function updateExpenseForItem(
  supabase: SupabaseClient,
  expenseId: string,
  item: Pick<ShoppingRow, "name" | "price" | "category" | "date">
) {
  const amount = Number(item.price);
  if (item.price == null || isNaN(amount) || amount <= 0) {
    return { error: "Укажите сумму, чтобы отметить покупку" as const };
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      title: item.name,
      category: item.category || "Прочее",
      amount,
      date: item.date,
    })
    .eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  return { expense_id: expenseId };
}

export async function deleteExpenseById(
  supabase: SupabaseClient,
  expenseId: string
) {
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function syncPurchaseToExpense(
  supabase: SupabaseClient,
  userId: string,
  item: ShoppingRow,
  purchased: boolean
) {
  if (purchased) {
    if (item.expense_id) {
      return updateExpenseForItem(supabase, item.expense_id, item);
    }
    return createExpenseForItem(supabase, userId, item);
  }

  if (item.expense_id) {
    const result = await deleteExpenseById(supabase, item.expense_id);
    if ("error" in result && result.error) {
      return result;
    }
  }

  return { expense_id: null as string | null };
}
