"use client";

import { cn } from "@/lib/utils";
import {
  Wallet,
  CheckSquare,
  ShoppingBag,
  Users,
} from "lucide-react";

export type TabId = "budget" | "tasks" | "shopping" | "guests";

const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "budget", label: "Бюджет", icon: Wallet },
  { id: "tasks", label: "Задачи", icon: CheckSquare },
  { id: "shopping", label: "Покупки", icon: ShoppingBag },
  { id: "guests", label: "Гости", icon: Users },
];

export function DashboardTabs({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-rose-100 pb-3">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === id
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-rose-50 text-rose-800 hover:bg-rose-100"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
