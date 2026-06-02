"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/lib/budgetCategories";
import { usePanelLoad } from "@/lib/usePanelLoad";
import type { ShoppingItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

function CategorySelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      className="flex h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm"
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
    >
      {DEFAULT_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");

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

  function startEdit(item: ShoppingItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || DEFAULT_CATEGORIES[0]);
    setEditPrice(item.price != null ? String(item.price) : "");
    setEditDate(item.date);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;

    const priceVal = parseFloat(editPrice);
    if (isNaN(priceVal) || priceVal < 0) return;

    setError("");
    try {
      await api.shopping.update(editingId, {
        name: editName.trim(),
        category: editCategory,
        price: priceVal,
        date: editDate,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить покупку"
      );
    }
  }

  async function togglePurchased(item: ShoppingItem) {
    if (editingId === item.id) return;
    setError("");
    try {
      await api.shopping.update(item.id, { purchased: !item.purchased });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить покупку");
    }
  }

  async function deleteItem(id: string) {
    if (editingId === id) setEditingId(null);
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
              <CategorySelect value={category} onChange={setCategory} />
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
            items.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="py-4">
                  <form onSubmit={saveEdit} className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-name-${item.id}`}>Название</Label>
                      <Input
                        id={`edit-name-${item.id}`}
                        value={editName}
                        onChange={(ev) => setEditName(ev.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`edit-category-${item.id}`}>
                          Категория
                        </Label>
                        <CategorySelect
                          id={`edit-category-${item.id}`}
                          value={editCategory}
                          onChange={setEditCategory}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-price-${item.id}`}>Сумма</Label>
                        <Input
                          id={`edit-price-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={editPrice}
                          onChange={(ev) => setEditPrice(ev.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-date-${item.id}`}>Дата</Label>
                      <Input
                        id={`edit-date-${item.id}`}
                        type="date"
                        value={editDate}
                        onChange={(ev) => setEditDate(ev.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Сохранить
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                </li>
              ) : (
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
                    onClick={() => startEdit(item)}
                    aria-label="Редактировать"
                  >
                    <Pencil className="h-4 w-4 text-rose-600" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              )
            )
          )}
        </ul>
      </Card>
    </div>
  );
}
