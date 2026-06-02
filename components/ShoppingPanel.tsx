"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePanelLoad } from "@/lib/usePanelLoad";
import type { ShoppingItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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
  const [price, setPrice] = useState("");

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

    const priceVal = price.trim() ? parseFloat(price) : null;
    if (price.trim() && (priceVal === null || isNaN(priceVal))) return;

    await api.shopping.create({
      name: name.trim(),
      price: priceVal,
    });
    setName("");
    setPrice("");
    load();
  }

  async function togglePurchased(item: ShoppingItem) {
    await api.shopping.update(item.id, { purchased: !item.purchased });
    load();
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

      <Card>
        <CardTitle>Добавить покупку</CardTitle>
        <form
          onSubmit={addItem}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-36">
            <Label>Цена (необяз.)</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
            />
          </div>
          <Button type="submit">Добавить</Button>
        </form>
      </Card>

      <Card>
        <ul className="divide-y divide-rose-50">
          {items.length === 0 ? (
            <li className="py-6 text-center text-rose-500">Список пуст</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 py-3"
              >
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
