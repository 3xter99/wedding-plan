import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardClient
      email={session.user.email ?? ""}
      userId={session.user.id}
    />
  );
}
