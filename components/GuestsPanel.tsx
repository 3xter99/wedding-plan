"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import type { Guest, GuestStatus, WeddingEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<GuestStatus, string> = {
  invited: "Приглашён",
  confirmed: "Подтвердил",
  declined: "Отказался",
};

const STATUS_SELECT_CLASSES: Record<GuestStatus, string> = {
  invited: "border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-300",
  confirmed:
    "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300",
  declined: "border-red-300 bg-red-50 text-red-800 focus:ring-red-300",
};

const STATUS_OPTION_CLASSES: Record<GuestStatus, string> = {
  invited: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  declined: "bg-red-50 text-red-800",
};

const STATUS_OPTION_COLORS: Record<
  GuestStatus,
  { backgroundColor: string; color: string }
> = {
  invited: { backgroundColor: "#fffbeb", color: "#92400e" },
  confirmed: { backgroundColor: "#ecfdf5", color: "#047857" },
  declined: { backgroundColor: "#fef2f2", color: "#dc2626" },
};

export function GuestsPanel({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventName, setEditingEventName] = useState("");
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState("");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const stats = useMemo(
    () => ({
      total: guests.length,
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      declined: guests.filter((g) => g.status === "declined").length,
      invited: guests.filter((g) => g.status === "invited").length,
    }),
    [guests]
  );

  const loadEvents = useCallback(async () => {
    const data = await api.events.get();
    setEvents(data);
    setSelectedEventId((current) => {
      if (current && data.some((event) => event.id === current)) return current;
      return data[0]?.id ?? null;
    });
    setLoadingEvents(false);
  }, []);

  const loadingGuests =
    !!selectedEventId && loadedEventId !== selectedEventId;

  const loadGuests = useCallback(async () => {
    if (!selectedEventId) {
      setGuests([]);
      setLoadedEventId(null);
      return;
    }

    const data = await api.guests.get(selectedEventId);
    setGuests(data);
    setLoadedEventId(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    if (!active) return;
    loadEvents();
  }, [active, loadEvents]);

  useEffect(() => {
    if (!active || !selectedEventId) return;
    loadGuests();
  }, [active, selectedEventId, loadGuests]);

  usePolling(
    loadGuests,
    active && !!selectedEventId && loadedEventId === selectedEventId,
    15000
  );

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !name.trim() || !selectedEventId) return;

    const guest = await api.guests.create(selectedEventId, name.trim());
    setName("");
    setGuests((prev) =>
      [...prev, guest].sort((a, b) => a.name.localeCompare(b.name, "ru"))
    );
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventName.trim()) return;

    const event = await api.events.create(newEventName.trim());
    setNewEventName("");
    setShowNewEvent(false);
    await loadEvents();
    setSelectedEventId(event.id);
    setLoadedEventId(null);
    setGuests([]);
  }

  async function saveEventName(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventId || !editingEventName.trim()) return;

    await api.events.update(editingEventId, editingEventName.trim());
    setEditingEventId(null);
    setEditingEventName("");
    loadEvents();
  }

  async function deleteEvent(id: string) {
    if (events.length <= 1) return;
    if (
      !confirm(
        "Удалить мероприятие и всех его гостей? Это действие нельзя отменить."
      )
    ) {
      return;
    }

    await api.events.delete(id);
    setLoadedEventId(null);
    setGuests([]);
    await loadEvents();
  }

  async function updateStatus(id: string, status: GuestStatus) {
    const guest = await api.guests.update(id, { status });
    setGuests((prev) => prev.map((g) => (g.id === id ? guest : g)));
  }

  function startEditGuest(guest: Guest) {
    setEditingGuestId(guest.id);
    setEditingGuestName(guest.name);
  }

  function cancelEditGuest() {
    setEditingGuestId(null);
    setEditingGuestName("");
  }

  async function saveGuestName(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuestId || !editingGuestName.trim()) return;

    const guest = await api.guests.update(editingGuestId, {
      name: editingGuestName.trim(),
    });
    setEditingGuestId(null);
    setEditingGuestName("");
    setGuests((prev) =>
      prev
        .map((g) => (g.id === guest.id ? guest : g))
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    );
  }

  async function deleteGuest(id: string) {
    if (editingGuestId === id) cancelEditGuest();
    await api.guests.delete(id);
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  if (loadingEvents) {
    return <p className="text-rose-600">Загрузка мероприятий…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle>Мероприятия</CardTitle>
            <p className="mt-1 text-sm text-rose-600">
              Бюджет общий для всех мероприятий, списки гостей — отдельные.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (event.id === selectedEventId) return;
                      setSelectedEventId(event.id);
                      setLoadedEventId(null);
                      setGuests([]);
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      selectedEventId === event.id
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                    )}
                  >
                    {event.name}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingEventId(event.id);
                      setEditingEventName(event.name);
                    }}
                    aria-label={`Переименовать ${event.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                  {events.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEvent(event.id)}
                      aria-label={`Удалить ${event.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewEvent((value) => !value)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Мероприятие
          </Button>
        </div>

        {showNewEvent && (
          <form
            onSubmit={addEvent}
            className="mt-4 flex flex-col gap-3 border-t border-rose-100 pt-4 sm:flex-row"
          >
            <Input
              className="flex-1"
              value={newEventName}
              onChange={(ev) => setNewEventName(ev.target.value)}
              placeholder="Название, например «ЗАГС» или «Банкет»"
              required
            />
            <Button type="submit">Создать</Button>
          </form>
        )}

        {editingEventId && (
          <form
            onSubmit={saveEventName}
            className="mt-4 flex flex-col gap-3 border-t border-rose-100 pt-4 sm:flex-row"
          >
            <Input
              className="flex-1"
              value={editingEventName}
              onChange={(ev) => setEditingEventName(ev.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Сохранить</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEventId(null)}
              >
                Отмена
              </Button>
            </div>
          </form>
        )}
      </Card>

      {loadingGuests ? (
        <p className="text-rose-600">Загрузка гостей…</p>
      ) : (
        <>
          {selectedEvent && (
            <p className="text-sm font-medium text-rose-800">
              Гости: {selectedEvent.name}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardTitle className="text-base">Всего</CardTitle>
              <p className="mt-1 text-2xl font-bold text-rose-950">
                {stats.total}
              </p>
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
              <Button type="submit" disabled={!selectedEventId}>
                Добавить
              </Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-rose-100 text-rose-800">
                  <th className="py-2 pr-4 font-medium">Имя</th>
                  <th className="py-2 pr-4 font-medium">Статус</th>
                  <th className="py-2 font-medium w-24" />
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
                        {editingGuestId === guest.id ? (
                          <form
                            onSubmit={saveGuestName}
                            className="flex min-w-[200px] flex-col gap-2 sm:flex-row sm:items-center"
                          >
                            <Input
                              value={editingGuestName}
                              onChange={(ev) =>
                                setEditingGuestName(ev.target.value)
                              }
                              className="h-8"
                              required
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button type="submit" size="sm">
                                OK
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditGuest}
                              >
                                Отмена
                              </Button>
                            </div>
                          </form>
                        ) : (
                          guest.name
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          className={`rounded-lg border px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 ${STATUS_SELECT_CLASSES[guest.status]}`}
                          value={guest.status}
                          disabled={editingGuestId === guest.id}
                          onChange={(ev) =>
                            updateStatus(guest.id, ev.target.value as GuestStatus)
                          }
                        >
                          {(Object.keys(STATUS_LABELS) as GuestStatus[]).map(
                            (s) => (
                              <option
                                key={s}
                                value={s}
                                className={STATUS_OPTION_CLASSES[s]}
                                style={STATUS_OPTION_COLORS[s]}
                              >
                                {STATUS_LABELS[s]}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditGuest(guest)}
                            disabled={editingGuestId === guest.id}
                            aria-label={`Редактировать ${guest.name}`}
                          >
                            <Pencil className="h-4 w-4 text-rose-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGuest(guest.id)}
                            aria-label={`Удалить ${guest.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
