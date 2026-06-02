import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";
import type { GuestStatus } from "@/lib/types";

const VALID_STATUSES: GuestStatus[] = ["invited", "confirmed", "declined"];

export async function GET() {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("guests")
    .select("*")
    .order("name", { ascending: true });

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

  const { data, error } = await supabase
    .from("guests")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      status: "invited",
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

  const body = await request.json();
  if (!body.id || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("guests")
    .update({ status: body.status })
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

  const { error } = await auth.supabase.from("guests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
