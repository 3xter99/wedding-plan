import type { Budget, Expense, Guest, GuestStatus, ShoppingItem, Task } from "@/lib/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : res.statusText
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  budget: {
    get: (signal?: AbortSignal) =>
      request<{ budget: Budget[]; expenses: Expense[] }>("/api/budget", {
        signal,
      }),
    setTotal: (total_budget: number) =>
      request<void>("/api/budget", {
        method: "PUT",
        body: JSON.stringify({ total_budget }),
      }),
  },
  expenses: {
    create: (data: {
      title: string;
      category: string;
      amount: number;
      date: string;
    }) =>
      request<Expense>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  tasks: {
    get: (signal?: AbortSignal) => request<Task[]>("/api/tasks", { signal }),
    create: (data: { title: string; deadline: string | null }) =>
      request<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Pick<Task, "completed">>) =>
      request<Task>("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<void>(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  shopping: {
    get: (signal?: AbortSignal) =>
      request<ShoppingItem[]>("/api/shopping", { signal }),
    create: (data: { name: string; price: number | null }) =>
      request<ShoppingItem>("/api/shopping", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Pick<ShoppingItem, "purchased">>) =>
      request<ShoppingItem>("/api/shopping", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<void>(`/api/shopping?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  guests: {
    get: (signal?: AbortSignal) => request<Guest[]>("/api/guests", { signal }),
    create: (name: string) =>
      request<Guest>("/api/guests", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: string, status: GuestStatus) =>
      request<Guest>("/api/guests", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      }),
    delete: (id: string) =>
      request<void>(`/api/guests?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
};
