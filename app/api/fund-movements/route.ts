import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";
import type { FundMovementType } from "@/lib/types";

const VALID_TYPES: FundMovementType[] = ["income", "withdrawal"];

export async function POST(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("fund_movements")
    .insert({
      user_id: user.id,
      type: body.type,
      title: body.title.trim(),
      amount,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      note: body.note?.trim() || null,
    })
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

  const { error } = await auth.supabase
    .from("fund_movements")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
