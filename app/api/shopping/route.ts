import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";
import {
  deleteExpenseById,
  syncPurchaseToExpense,
} from "@/lib/shoppingExpenseSync";

export async function GET() {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("shopping_items")
    .select("*")
    .order("purchased", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const price =
    body.price != null && body.price !== "" ? Number(body.price) : null;
  if (price != null && (isNaN(price) || price < 0)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      price,
      category: body.category?.trim() || "Прочее",
      date: body.date ?? new Date().toISOString().slice(0, 10),
      purchased: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("id", body.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const nextItem = {
    ...existing,
    name: body.name?.trim() ?? existing.name,
    category: body.category?.trim() ?? existing.category,
    date: body.date ?? existing.date,
    price:
      body.price !== undefined
        ? body.price != null && body.price !== ""
          ? Number(body.price)
          : null
        : existing.price,
    purchased:
      body.purchased !== undefined ? Boolean(body.purchased) : existing.purchased,
  };

  if (nextItem.price != null && (isNaN(Number(nextItem.price)) || Number(nextItem.price) < 0)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  let expense_id = existing.expense_id as string | null;

  if (body.purchased !== undefined && nextItem.purchased !== existing.purchased) {
    const sync = await syncPurchaseToExpense(supabase, user.id, nextItem, nextItem.purchased);
    if ("error" in sync) {
      return NextResponse.json({ error: sync.error }, { status: 400 });
    }
    expense_id = sync.expense_id;
  } else if (nextItem.purchased && expense_id) {
    const sync = await syncPurchaseToExpense(supabase, user.id, nextItem, true);
    if ("error" in sync) {
      return NextResponse.json({ error: sync.error }, { status: 400 });
    }
    expense_id = sync.expense_id;
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .update({
      name: nextItem.name,
      category: nextItem.category,
      date: nextItem.date,
      price: nextItem.price,
      purchased: nextItem.purchased,
      expense_id,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { supabase } = auth;

  const { data: existing } = await supabase
    .from("shopping_items")
    .select("expense_id")
    .eq("id", id)
    .single();

  if (existing?.expense_id) {
    const result = await deleteExpenseById(supabase, existing.expense_id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  const { error } = await supabase.from("shopping_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
