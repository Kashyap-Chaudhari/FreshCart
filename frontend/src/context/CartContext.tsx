'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  unit: string;
  price: number;
  mrp: number;
  taxPercent: number;
  stockQty: number;
  isAvailable: boolean;
  images: string[];
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: CartProduct, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('freshcart_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignore localstorage errors
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('freshcart_cart', JSON.stringify(items));
      } catch {
        // Ignore
      }
    }
  }, [items, isLoaded]);

  const addToCart = (product: CartProduct, qtyToAdd: number = 1): { success: boolean; message: string } => {
    if (!product.isAvailable || product.stockQty <= 0) {
      return { success: false, message: `"${product.name}" is currently out of stock.` };
    }

    const existingIndex = items.findIndex((it) => it.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const proposedQty = currentQtyInCart + qtyToAdd;

    if (proposedQty > product.stockQty) {
      const allowedAdd = product.stockQty - currentQtyInCart;
      if (allowedAdd <= 0) {
        return {
          success: false,
          message: `Cannot add more. You already have the maximum available stock (${product.stockQty} ${product.unit}) in your cart.`,
        };
      }
      // Add up to available limit
      setItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, quantity: product.stockQty } : it))
      );
      return {
        success: true,
        message: `Added ${allowedAdd} more. Cart has reached maximum available stock (${product.stockQty}).`,
      };
    }

    if (existingIndex > -1) {
      setItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, quantity: proposedQty } : it))
      );
    } else {
      setItems((prev) => [...prev, { product, quantity: qtyToAdd }]);
    }

    return { success: true, message: `Added "${product.name}" to your cart.` };
  };

  const updateQuantity = (productId: string, newQty: number): { success: boolean; message?: string } => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const item = items.find((it) => it.product.id === productId);
    if (!item) return { success: false };

    if (newQty > item.product.stockQty) {
      setItems((prev) =>
        prev.map((it) => (it.product.id === productId ? { ...it, quantity: item.product.stockQty } : it))
      );
      return {
        success: false,
        message: `Only ${item.product.stockQty} units available in stock. Adjusted to maximum limit.`,
      };
    }

    setItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: newQty } : it))
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Math.round(items.reduce((acc, it) => acc + Number(it.product.price) * it.quantity, 0) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
