"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CartItem } from "@/types/domain";

const STORAGE_KEY = "gr-design:cart";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (
    productId: string,
    optionId: string | null,
    quantity: number,
  ) => void;
  updateNote: (
    productId: string,
    optionId: string | null,
    note: string,
  ) => void;
  removeItem: (productId: string, optionId: string | null) => void;
  clear: () => void;
  replaceItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Uma linha do carrinho é identificada pelo produto **e** pela opção de
 * compra selecionada — duas opções diferentes do mesmo produto (ex: uma
 * unidade avulsa e um "Kit 20") nunca devem se misturar na mesma linha. */
function isSameLine(
  entry: CartItem,
  productId: string,
  optionId: string | null,
): boolean {
  return entry.productId === productId && entry.optionId === optionId;
}

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Lido após o primeiro paint de propósito: o servidor nunca tem acesso ao
    // localStorage, então ler aqui (e não no estado inicial) evita um
    // mismatch de hidratação entre o HTML do servidor e o do cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Armazenamento indisponível (modo privado, cota excedida etc.) —
      // o carrinho continua funcionando apenas em memória nesta aba.
    }
  }, [items, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) =>
          isSameLine(entry, item.productId, item.optionId),
        );
        if (existing) {
          return current.map((entry) =>
            isSameLine(entry, item.productId, item.optionId)
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry,
          );
        }
        return [...current, { ...item, quantity }];
      });
    },
    [],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    (productId, optionId, quantity) => {
      setItems((current) => {
        if (quantity <= 0) {
          return current.filter(
            (entry) => !isSameLine(entry, productId, optionId),
          );
        }
        return current.map((entry) =>
          isSameLine(entry, productId, optionId)
            ? { ...entry, quantity }
            : entry,
        );
      });
    },
    [],
  );

  const updateNote = useCallback<CartContextValue["updateNote"]>(
    (productId, optionId, note) => {
      const trimmed = note.trim();
      setItems((current) =>
        current.map((entry) =>
          isSameLine(entry, productId, optionId)
            ? { ...entry, note: trimmed === "" ? undefined : note }
            : entry,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>(
    (productId, optionId) => {
      setItems((current) =>
        current.filter((entry) => !isSameLine(entry, productId, optionId)),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const replaceItems = useCallback<CartContextValue["replaceItems"]>((next) => {
    setItems(next);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      addItem,
      updateQuantity,
      updateNote,
      removeItem,
      clear,
      replaceItems,
    }),
    [
      items,
      totalItems,
      subtotal,
      addItem,
      updateQuantity,
      updateNote,
      removeItem,
      clear,
      replaceItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>");
  }
  return ctx;
}
