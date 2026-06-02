import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function getAuthSupabase() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { supabase, user: session.user } as const;
}
