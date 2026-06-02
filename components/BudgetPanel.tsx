"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { usePanelLoad } from "@/lib/usePanelLoad";
import type { Budget, Expense } from "@/lib/types";
import {
  budgetProgressColor,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function BudgetPanel({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [budgetRows, setBudgetRows] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { loading, reload: load } = usePanelLoad(
    active,
    (signal) => api.budget.get(signal),
    (data) => {
      setBudgetRows(data.budget);
      setExpenses(data.expenses);
    }
  );
  const [totalInput, setTotalInput] = useState("");

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

    await api.budget.setTotal(value);
    setTotalInput("");
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
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Список расходов</CardTitle>
        <p className="mt-1 text-sm text-rose-500">
          Расходы появляются здесь, когда покупку отмечают галочкой во вкладке
          «Покупки».
        </p>
        <ul className="mt-4 divide-y divide-rose-50">
          {expenses.length === 0 ? (
            <li className="py-6 text-center text-rose-500">Нет расходов</li>
          ) : (
            expenses.map((exp) => (
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
                <span className="font-semibold text-rose-900">
                  {formatCurrency(Number(exp.amount))}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
