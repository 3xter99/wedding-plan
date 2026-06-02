import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";
import type { GuestStatus } from "@/lib/types";

const VALID_STATUSES: GuestStatus[] = ["invited", "confirmed", "declined"];

export async function GET(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const eventId = new URL(request.url).searchParams.get("event_id");
  if (!eventId) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("guests")
    .select("*")
    .eq("event_id", eventId)
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

  if (!body.name?.trim() || !body.event_id) {
    return NextResponse.json({ error: "Name and event_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({
      user_id: user.id,
      event_id: body.event_id,
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
  if (!body.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates: { status?: GuestStatus; name?: string } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    updates.name = name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("guests")
    .update(updates)
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
