"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineInput } from "@/types";

export interface CartItem {
  productId: string;
  finishId: string;
  slug: string;
  name: string;
  finishName: string;
  finishHex: string;
  /** Apenas para exibição: o servidor sempre recalcula o preço. */
  unitPriceCents: number;
  quantity: number;
  maxStock: number;
  image: string | null;
  imageAlt: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  cep: string;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  addMany: (items: (Omit<CartItem, "quantity"> & { quantity: number })[]) => void;
  setQuantity: (productId: string, finishId: string, quantity: number) => void;
  remove: (productId: string, finishId: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null) => void;
  setCep: (cep: string) => void;
}

const MAX_QTY = 99;
const clamp = (q: number, stock: number) => Math.max(1, Math.min(q, MAX_QTY, stock > 0 ? stock : MAX_QTY));
const same = (a: CartItem, productId: string, finishId: string) => a.productId === productId && a.finishId === finishId;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      cep: "",
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => same(i, item.productId, item.finishId));
          if (existing) {
            return { items: s.items.map((i) => (i === existing ? { ...i, ...item, quantity: clamp(i.quantity + quantity, item.maxStock) } : i)), isOpen: true };
          }
          return { items: [...s.items, { ...item, quantity: clamp(quantity, item.maxStock) }], isOpen: true };
        }),
      addMany: (list) =>
        set((s) => {
          let items = [...s.items];
          for (const it of list) {
            const existing = items.find((i) => same(i, it.productId, it.finishId));
            items = existing
              ? items.map((i) => (i === existing ? { ...i, quantity: clamp(i.quantity + it.quantity, it.maxStock) } : i))
              : [...items, { ...it, quantity: clamp(it.quantity, it.maxStock) }];
          }
          return { items, isOpen: true };
        }),
      setQuantity: (productId, finishId, quantity) =>
        set((s) => ({ items: s.items.map((i) => (same(i, productId, finishId) ? { ...i, quantity: clamp(quantity, i.maxStock) } : i)) })),
      remove: (productId, finishId) => set((s) => ({ items: s.items.filter((i) => !same(i, productId, finishId)) })),
      replace: (items) => set({ items }),
      clear: () => set({ items: [], couponCode: null }),
      setOpen: (isOpen) => set({ isOpen }),
      setCoupon: (couponCode) => set({ couponCode }),
      setCep: (cep) => set({ cep }),
    }),
    {
      name: "cambara-cart",
      version: 1,
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, cep: s.cep }),
    },
  ),
);

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0);
export const toLineInputs = (items: CartItem[]): CartLineInput[] =>
  items.map((i) => ({ productId: i.productId, finishId: i.finishId, quantity: i.quantity }));
