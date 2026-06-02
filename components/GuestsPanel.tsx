"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import type { Guest, GuestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<GuestStatus, string> = {
  invited: "Приглашён",
  confirmed: "Подтвердил",
  declined: "Отказался",
};

export function GuestsPanel() {
  const supabase = useSupabase();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("guests")
      .select("*")
      .order("name", { ascending: true });

    if (data) setGuests(data as Guest[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable(supabase, "guests", load);

  const stats = useMemo(
    () => ({
      total: guests.length,
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      declined: guests.filter((g) => g.status === "declined").length,
      invited: guests.filter((g) => g.status === "invited").length,
    }),
    [guests]
  );

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !name.trim()) return;

    await supabase.from("guests").insert({
      user_id: userId,
      name: name.trim(),
      status: "invited" as GuestStatus,
    });
    setName("");
    load();
  }

  async function updateStatus(id: string, status: GuestStatus) {
    await supabase.from("guests").update({ status }).eq("id", id);
    load();
  }

  async function deleteGuest(id: string) {
    await supabase.from("guests").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-rose-600">Загрузка гостей…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardTitle className="text-base">Всего</CardTitle>
          <p className="mt-1 text-2xl font-bold text-rose-950">{stats.total}</p>
        </Card>
        <Card>
          <CardTitle className="text-base">Подтвердили</CardTitle>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {stats.confirmed}
          </p>
        </Card>
        <Card>
          <CardTitle className="text-base">Отказали</CardTitle>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {stats.declined}
          </p>
        </Card>
        <Card>
          <CardTitle className="text-base">Ожидают</CardTitle>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {stats.invited}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>Добавить гостя</CardTitle>
        <form
          onSubmit={addGuest}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <Input
            className="flex-1"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="Имя гостя"
            required
          />
          <Button type="submit">Добавить</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-rose-800">
              <th className="py-2 pr-4 font-medium">Имя</th>
              <th className="py-2 pr-4 font-medium">Статус</th>
              <th className="py-2 font-medium w-12" />
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-rose-500">
                  Нет гостей
                </td>
              </tr>
            ) : (
              guests.map((guest) => (
                <tr key={guest.id} className="border-b border-rose-50">
                  <td className="py-3 pr-4 font-medium text-rose-950">
                    {guest.name}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      className="rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-sm"
                      value={guest.status}
                      onChange={(ev) =>
                        updateStatus(guest.id, ev.target.value as GuestStatus)
                      }
                    >
                      {(Object.keys(STATUS_LABELS) as GuestStatus[]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGuest(guest.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
