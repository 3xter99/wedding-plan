import type {
  Budget,
  Expense,
  FundMovement,
  FundMovementType,
  Guest,
  GuestStatus,
  ShoppingItem,
  Task,
  WeddingEvent,
} from "@/lib/types";

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
      request<{
        budget: Budget[];
        expenses: Expense[];
        fund_movements: FundMovement[];
      }>("/api/budget", {
        signal,
      }),
    setTotal: (total_budget: number) =>
      request<void>("/api/budget", {
        method: "PUT",
        body: JSON.stringify({ total_budget }),
      }),
  },
  fundMovements: {
    create: (data: {
      type: FundMovementType;
      title: string;
      amount: number;
      date: string;
      note?: string | null;
    }) =>
      request<FundMovement>("/api/fund-movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/fund-movements?id=${encodeURIComponent(id)}`, {
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
    create: (data: {
      name: string;
      price: number | null;
      category: string;
      date: string;
    }) =>
      request<ShoppingItem>("/api/shopping", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: Partial<
        Pick<ShoppingItem, "purchased" | "name" | "price" | "category" | "date">
      >
    ) =>
      request<ShoppingItem>("/api/shopping", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<void>(`/api/shopping?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  events: {
    get: (signal?: AbortSignal) =>
      request<WeddingEvent[]>("/api/events", { signal }),
    create: (name: string) =>
      request<WeddingEvent>("/api/events", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: string, name: string) =>
      request<WeddingEvent>("/api/events", {
        method: "PATCH",
        body: JSON.stringify({ id, name }),
      }),
    delete: (id: string) =>
      request<void>(`/api/events?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  guests: {
    get: (eventId: string, signal?: AbortSignal) =>
      request<Guest[]>(`/api/guests?event_id=${encodeURIComponent(eventId)}`, {
        signal,
      }),
    create: (eventId: string, name: string) =>
      request<Guest>("/api/guests", {
        method: "POST",
        body: JSON.stringify({ event_id: eventId, name }),
      }),
    update: (
      id: string,
      data: Partial<Pick<Guest, "status" | "name">>
    ) =>
      request<Guest>("/api/guests", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<void>(`/api/guests?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
};
