import { NextResponse } from "next/server";
import { getAuthSupabase } from "@/lib/apiAuth";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_EVENT_NAME = "Мероприятие 1";

async function ensureDefaultEvent(supabase: SupabaseClient, userId: string) {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (events && events.length > 0) return events;

  const { data: created, error: insertError } = await supabase
    .from("events")
    .insert({ user_id: userId, name: DEFAULT_EVENT_NAME })
    .select()
    .single();

  if (insertError) throw insertError;
  return [created];
}

export async function GET() {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  try {
    const events = await ensureDefaultEvent(supabase, user.id);
    return NextResponse.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthSupabase();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ user_id: user.id, name })
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
  const name = body.name?.trim();

  if (!body.id || !name) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("events")
    .update({ name })
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

  const { data: events, error: countError } = await auth.supabase
    .from("events")
    .select("id");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if (!events || events.length <= 1) {
    return NextResponse.json(
      { error: "Нельзя удалить последнее мероприятие" },
      { status: 400 }
    );
  }

  const { error } = await auth.supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
