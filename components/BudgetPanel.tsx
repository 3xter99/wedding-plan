"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Trash2 } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import type { Budget, Expense } from "@/lib/types";
import {
  budgetProgressColor,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

const CHART_COLORS = [
  "#e11d48",
  "#d97706",
  "#4d7c0f",
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];

const DEFAULT_CATEGORIES = [
  "Площадка",
  "Кейтеринг",
  "Декор",
  "Одежда",
  "Фото/видео",
  "Музыка",
  "Прочее",
];

export function BudgetPanel() {
  const supabase = useSupabase();
  const [budgetRows, setBudgetRows] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalInput, setTotalInput] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [budgetRes, expensesRes] = await Promise.all([
      supabase.from("budget").select("*").order("created_at", { ascending: true }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);

    if (budgetRes.data) setBudgetRows(budgetRes.data as Budget[]);
    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable(supabase, "budget", load);
  useRealtimeTable(supabase, "expenses", load);

  const totalBudget = useMemo(() => {
    if (budgetRows.length === 0) return 0;
    return Number(
      [...budgetRows].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].total_budget
    );
  }, [budgetRows]);

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const remaining = totalBudget - totalSpent;
  const percentUsed =
    totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || "Прочее";
      map.set(cat, (map.get(cat) ?? 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  async function saveTotalBudget() {
    if (!userId) return;
    const value = parseFloat(totalInput);
    if (isNaN(value) || value < 0) return;

    if (budgetRows.length > 0) {
      await Promise.all(
        budgetRows.map((b) =>
          supabase.from("budget").update({ total_budget: value }).eq("id", b.id)
        )
      );
    } else {
      await supabase.from("budget").insert({
        user_id: userId,
        total_budget: value,
      });
    }
    setTotalInput("");
    load();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newTitle.trim()) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) return;

    await supabase.from("expenses").insert({
      user_id: userId,
      title: newTitle.trim(),
      category: newCategory,
      amount,
      date: newDate,
    });
    setNewTitle("");
    setNewAmount("");
    load();
  }

  async function deleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    load();
  }

  if (loading) {
    return <p className="text-rose-600">Загрузка бюджета…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Общий бюджет</CardTitle>
          <p className="mt-2 text-2xl font-bold text-rose-950">
            {formatCurrency(totalBudget)}
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Новая сумма"
              value={totalInput}
              onChange={(ev) => setTotalInput(ev.target.value)}
            />
            <Button type="button" onClick={saveTotalBudget}>
              Сохранить
            </Button>
          </div>
        </Card>
        <Card>
          <CardTitle>Потрачено</CardTitle>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatCurrency(totalSpent)}
          </p>
        </Card>
        <Card>
          <CardTitle>Остаток</CardTitle>
          <p
            className={`mt-2 text-2xl font-bold ${
              remaining >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {formatCurrency(remaining)}
          </p>
        </Card>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm text-rose-800">
          <span>Использовано бюджета</span>
          <span>{percentUsed.toFixed(0)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-rose-100">
          <div
            className={`h-full transition-all ${budgetProgressColor(percentUsed)}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Расходы по категориям</CardTitle>
          {categoryData.length === 0 ? (
            <p className="mt-4 text-sm text-rose-500">Нет расходов</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Добавить расход</CardTitle>
          <form onSubmit={addExpense} className="mt-4 space-y-3">
            <div>
              <Label>Название</Label>
              <Input
                value={newTitle}
                onChange={(ev) => setNewTitle(ev.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Категория</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm"
                  value={newCategory}
                  onChange={(ev) => setNewCategory(ev.target.value)}
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Сумма</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newAmount}
                  onChange={(ev) => setNewAmount(ev.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Дата</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(ev) => setNewDate(ev.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Добавить
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardTitle>Список расходов</CardTitle>
        <ul className="mt-4 divide-y divide-rose-50">
          {expenses.map((exp) => (
            <li
              key={exp.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="font-medium text-rose-950">{exp.title}</p>
                <p className="text-sm text-rose-600">
                  {exp.category} · {formatDate(exp.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-rose-900">
                  {formatCurrency(Number(exp.amount))}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteExpense(exp.id)}
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
