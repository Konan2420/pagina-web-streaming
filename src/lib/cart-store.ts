import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  whatsapp: string;
  quantity: number;
};

type State = { items: CartItem[] };

const STORAGE_KEY = "cmd_cart_v1";

function load(): State {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return { items: parsed.items };
  } catch {
    // Corrupt or unavailable storage — fall back to an empty cart.
  }
  return { items: [] };
}

const EMPTY_STATE: State = { items: [] };

let state: State = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — keep the in-memory cart working.
    }
  }
  listeners.forEach((l) => l());
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
}

export const cartStore = {
  subscribe(l: () => void) {
    ensureHydrated();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getState() {
    ensureHydrated();
    return state;
  },
  getServerState(): State {
    // Must return a stable reference: React re-invokes this on every render.
    return EMPTY_STATE;
  },
  add(item: Omit<CartItem, "quantity">, qty = 1) {
    ensureHydrated();
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) {
      state = {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i,
        ),
      };
    } else {
      state = { items: [...state.items, { ...item, quantity: qty }] };
    }
    emit();
  },
  increment(id: string) {
    ensureHydrated();
    state = {
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)),
    };
    emit();
  },
  decrement(id: string) {
    ensureHydrated();
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    if (item.quantity <= 1) {
      state = { items: state.items.filter((i) => i.id !== id) };
    } else {
      state = {
        items: state.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)),
      };
    }
    emit();
  },
  remove(id: string) {
    ensureHydrated();
    state = { items: state.items.filter((i) => i.id !== id) };
    emit();
  },
  clear() {
    ensureHydrated();
    state = { items: [] };
    emit();
  },
};

export function useCart() {
  const s = useSyncExternalStore(cartStore.subscribe, cartStore.getState, cartStore.getServerState);
  const count = s.items.reduce((n, i) => n + i.quantity, 0);
  const total = s.items.reduce((n, i) => n + i.quantity * i.price, 0);
  return { items: s.items, count, total };
}
