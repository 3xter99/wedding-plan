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
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePanelLoad } from "@/lib/usePanelLoad";
import type { Budget, Expense, FundMovement } from "@/lib/types";
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

const MOVEMENT_LABELS = {
  income: "Поступление",
  withdrawal: "Списание",
} as const;

function MovementForm({
  type,
  onSubmit,
}: {
  type: "income" | "withdrawal";
  onSubmit: (data: {
    title: string;
    amount: number;
    date: string;
    note: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    await onSubmit({
      title: title.trim(),
      amount: amountVal,
      date,
      note: note.trim(),
    });
    setTitle("");
    setAmount("");
    setNote("");
  }

  const isIncome = type === "income";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>{isIncome ? "Откуда / за что" : "Куда / за что"}</Label>
        <Input
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder={
            isIncome ? "Подарок от родителей" : "Перевод на другие цели"
          }
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Сумма</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            required
          />
        </div>
        <div>
          <Label>Дата</Label>
          <Input
            type="date"
            value={date}
            onChange={(ev) => setDate(ev.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Комментарий (необяз.)</Label>
        <Input
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          placeholder="Пояснение"
        />
      </div>
      <Button
        type="submit"
        className="w-full sm:w-auto"
        variant={isIncome ? "default" : "outline"}
      >
        {isIncome ? "Добавить поступление" : "Списать из бюджета"}
      </Button>
    </form>
  );
}

export function BudgetPanel({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [budgetRows, setBudgetRows] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fundMovements, setFundMovements] = useState<FundMovement[]>([]);
  const { loading, reload: load } = usePanelLoad(
    active,
    (signal) => api.budget.get(signal),
    (data) => {
      setBudgetRows(data.budget);
      setExpenses(data.expenses);
      setFundMovements(data.fund_movements);
    }
  );
  const [totalInput, setTotalInput] = useState("");

  const startingBudget = useMemo(() => {
    if (budgetRows.length === 0) return 0;
    return Number(
      [...budgetRows].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].total_budget
    );
  }, [budgetRows]);

  const totalIncome = useMemo(
    () =>
      fundMovements
        .filter((m) => m.type === "income")
        .reduce((s, m) => s + Number(m.amount), 0),
    [fundMovements]
  );

  const totalWithdrawals = useMemo(
    () =>
      fundMovements
        .filter((m) => m.type === "withdrawal")
        .reduce((s, m) => s + Number(m.amount), 0),
    [fundMovements]
  );

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const available = startingBudget + totalIncome - totalWithdrawals;
  const remaining = available - totalSpent;
  const percentUsed =
    available > 0 ? Math.min(100, (totalSpent / available) * 100) : 0;

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

  async function addMovement(
    type: "income" | "withdrawal",
    data: { title: string; amount: number; date: string; note: string }
  ) {
    await api.fundMovements.create({
      type,
      title: data.title,
      amount: data.amount,
      date: data.date,
      note: data.note || null,
    });
    load();
  }

  async function deleteMovement(id: string) {
    await api.fundMovements.delete(id);
    load();
  }

  if (loading) {
    return <p className="text-rose-600">Загрузка бюджета…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardTitle className="text-base">Стартовый бюджет</CardTitle>
          <p className="mt-2 text-2xl font-bold text-rose-950">
            {formatCurrency(startingBudget)}
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Новая сумма"
              value={totalInput}
              onChange={(ev) => setTotalInput(ev.target.value)}
            />
            <Button type="button" size="sm" onClick={saveTotalBudget}>
              OK
            </Button>
          </div>
        </Card>
        <Card>
          <CardTitle className="text-base">Поступления</CardTitle>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            +{formatCurrency(totalIncome)}
          </p>
        </Card>
        <Card>
          <CardTitle className="text-base">Ушло из фонда</CardTitle>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            −{formatCurrency(totalWithdrawals)}
          </p>
        </Card>
        <Card>
          <CardTitle className="text-base">Потрачено</CardTitle>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatCurrency(totalSpent)}
          </p>
          <p className="mt-1 text-xs text-rose-500">На свадьбу, из покупок</p>
        </Card>
        <Card>
          <CardTitle className="text-base">Свободный остаток</CardTitle>
          <p
            className={`mt-2 text-2xl font-bold ${
              remaining >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {formatCurrency(remaining)}
          </p>
          <p className="mt-1 text-xs text-rose-500">
            Доступно {formatCurrency(available)}
          </p>
        </Card>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm text-rose-800">
          <span>Потрачено из доступного</span>
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
          <CardTitle>Добавить поступление</CardTitle>
          <p className="mt-1 text-sm text-rose-500">
            Подарки, возвраты, дополнительные взносы в свадебный фонд.
          </p>
          <div className="mt-4">
            <MovementForm
              type="income"
              onSubmit={(data) => addMovement("income", data)}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Списать из бюджета</CardTitle>
          <p className="mt-1 text-sm text-rose-500">
            Деньги ушли не на свадьбу — другие цели, резерв, перевод.
          </p>
          <div className="mt-4">
            <MovementForm
              type="withdrawal"
              onSubmit={(data) => addMovement("withdrawal", data)}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Движения по фонду</CardTitle>
        <ul className="mt-4 divide-y divide-rose-50">
          {fundMovements.length === 0 ? (
            <li className="py-6 text-center text-rose-500">
              Нет поступлений и списаний
            </li>
          ) : (
            fundMovements.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium text-rose-950">{m.title}</p>
                  <p className="text-sm text-rose-600">
                    {MOVEMENT_LABELS[m.type]} · {formatDate(m.date)}
                    {m.note ? ` · ${m.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${
                      m.type === "income"
                        ? "text-emerald-700"
                        : "text-orange-700"
                    }`}
                  >
                    {m.type === "income" ? "+" : "−"}
                    {formatCurrency(Number(m.amount))}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMovement(m.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <CardTitle>Расходы по категориям</CardTitle>
        {categoryData.length === 0 ? (
          <p className="mt-4 text-sm text-rose-500">Нет расходов</p>
        ) : (
          <div className="mt-4 h-64 min-w-0">
            {active && (
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
            )}
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
