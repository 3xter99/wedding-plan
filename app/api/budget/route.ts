import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";

export async function GET() {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const [budgetRes, expensesRes, movementsRes] = await Promise.all([
    supabase.from("budget").select("*").order("created_at", { ascending: true }),
    supabase.from("expenses").select("*").order("date", { ascending: false }),
    supabase
      .from("fund_movements")
      .select("*")
      .order("date", { ascending: false }),
  ]);

  if (budgetRes.error) {
    return NextResponse.json({ error: budgetRes.error.message }, { status: 500 });
  }
  if (expensesRes.error) {
    return NextResponse.json({ error: expensesRes.error.message }, { status: 500 });
  }
  if (movementsRes.error) {
    return NextResponse.json({ error: movementsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    budget: budgetRes.data ?? [],
    expenses: expensesRes.data ?? [],
    fund_movements: movementsRes.data ?? [],
  });
}

export async function PUT(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();
  const total_budget = Number(body.total_budget);

  if (isNaN(total_budget) || total_budget < 0) {
    return NextResponse.json({ error: "Invalid total_budget" }, { status: 400 });
  }

  const { data: existing } = await supabase.from("budget").select("id");

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("budget")
      .update({ total_budget })
      .in(
        "id",
        existing.map((b) => b.id)
      );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("budget").insert({
      user_id: user.id,
      total_budget,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return new NextResponse(null, { status: 204 });
}
