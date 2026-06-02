"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/lib/budgetCategories";
import { usePanelLoad } from "@/lib/usePanelLoad";
import type { ShoppingItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

export function ShoppingPanel({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const { loading, reload: load } = usePanelLoad(
    active,
    (signal) => api.shopping.get(signal),
    setItems
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const { purchasedSum, plannedSum, remainingPlanned } = useMemo(() => {
    const purchased = items.filter((i) => i.purchased);
    const notPurchased = items.filter((i) => !i.purchased);
    const sum = (list: ShoppingItem[]) =>
      list.reduce((s, i) => s + (i.price != null ? Number(i.price) : 0), 0);
    const purchasedSum = sum(purchased);
    const plannedSum = sum(items);
    const remainingPlanned = sum(notPurchased);
    return { purchasedSum, plannedSum, remainingPlanned };
  }, [items]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !name.trim()) return;

    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal < 0) return;

    setError("");
    await api.shopping.create({
      name: name.trim(),
      price: priceVal,
      category,
      date,
    });
    setName("");
    setPrice("");
    load();
  }

  async function togglePurchased(item: ShoppingItem) {
    setError("");
    try {
      await api.shopping.update(item.id, { purchased: !item.purchased });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить покупку");
    }
  }

  async function deleteItem(id: string) {
    await api.shopping.delete(id);
    load();
  }

  if (loading) return <p className="text-rose-600">Загрузка покупок…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Куплено на сумму</CardTitle>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(purchasedSum)}
          </p>
          <p className="mt-1 text-xs text-rose-500">
            Учитывается в бюджете после галочки
          </p>
        </Card>
        <Card>
          <CardTitle>Всего в списке</CardTitle>
          <p className="mt-2 text-2xl font-bold text-rose-950">
            {formatCurrency(plannedSum)}
          </p>
        </Card>
        <Card>
          <CardTitle>Осталось купить</CardTitle>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatCurrency(remainingPlanned)}
          </p>
        </Card>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card>
        <CardTitle>Добавить покупку</CardTitle>
        <form onSubmit={addItem} className="mt-4 space-y-3">
          <div>
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Категория</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm"
                value={category}
                onChange={(ev) => setCategory(ev.target.value)}
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
                value={price}
                onChange={(ev) => setPrice(ev.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Дата</Label>
            <Input
              type="date"
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Добавить
          </Button>
        </form>
      </Card>

      <Card>
        <ul className="divide-y divide-rose-50">
          {items.length === 0 ? (
            <li className="py-6 text-center text-rose-500">Список пуст</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={item.purchased}
                  onChange={() => togglePurchased(item)}
                  className="h-5 w-5 rounded border-rose-300 text-rose-600"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${
                      item.purchased
                        ? "text-rose-400 line-through"
                        : "text-rose-950"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="text-sm text-rose-600">
                    {item.category} · {formatDate(item.date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-rose-800">
                  {item.price != null
                    ? formatCurrency(Number(item.price))
                    : "—"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
