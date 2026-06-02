"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Heart } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { DashboardTabs, type TabId } from "@/components/DashboardTabs";
import { BudgetPanel } from "@/components/BudgetPanel";
import { TasksPanel } from "@/components/TasksPanel";
import { ShoppingPanel } from "@/components/ShoppingPanel";
import { GuestsPanel } from "@/components/GuestsPanel";
import { Button } from "@/components/ui/button";

export function DashboardClient({ email }: { email: string }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("budget");

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <Heart className="h-6 w-6 text-rose-600" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-rose-950 sm:text-3xl">
              Свадебный планировщик
            </h1>
            <p className="text-sm text-rose-600">{email}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </header>

      <DashboardTabs active={tab} onChange={setTab} />

      <section className="mt-6">
        {tab === "budget" && <BudgetPanel />}
        {tab === "tasks" && <TasksPanel />}
        {tab === "shopping" && <ShoppingPanel />}
        {tab === "guests" && <GuestsPanel />}
      </section>
    </div>
  );
}
