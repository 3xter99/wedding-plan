"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import type { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

type Filter = "all" | "active" | "completed";

export function TasksPanel() {
  const supabase = useSupabase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false });

    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable(supabase, "tasks", load);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);
    return list.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
  }, [tasks, filter]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !title.trim()) return;

    await supabase.from("tasks").insert({
      user_id: userId,
      title: title.trim(),
      deadline: deadline || null,
      completed: false,
    });
    setTitle("");
    setDeadline("");
    load();
  }

  async function toggleCompleted(task: Task) {
    await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);
    load();
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-rose-600">Загрузка задач…</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Новая задача</CardTitle>
        <form onSubmit={addTask} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="Заказать торт"
              required
            />
          </div>
          <div>
            <Label>Дедлайн</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(ev) => setDeadline(ev.target.value)}
            />
          </div>
          <Button type="submit">Добавить</Button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Все"],
            ["active", "Активные"],
            ["completed", "Выполненные"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === id
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <ul className="divide-y divide-rose-50">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-rose-500">Нет задач</li>
          ) : (
            filtered.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 py-3"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleCompleted(task)}
                  className="h-5 w-5 rounded border-rose-300 text-rose-600"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${
                      task.completed
                        ? "text-rose-400 line-through"
                        : "text-rose-950"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-sm text-rose-600">
                    {formatDate(task.deadline)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
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
