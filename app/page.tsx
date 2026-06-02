import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
