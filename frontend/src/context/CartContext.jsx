import { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

// A simple external ref so CartContext can read loginOpen without circular deps
export const loginOpenRef = { current: false };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(() => window.location.pathname === '/cart');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const key = product.cartKey || product._id;
    setCart((prev) => {
      const existing = prev.find(i => (i.cartKey || i._id) === key);
      if (existing) return prev.map(i => (i.cartKey || i._id) === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return setCart((prev) => prev.filter(i => (i.cartKey || i._id) !== id));
    setCart((prev) => prev.map(i => (i.cartKey || i._id) === id ? { ...i, qty } : i));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const openCart = () => { if (!loginOpenRef.current) setCartOpen(true); };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, clearCart, subtotal, cartOpen, setCartOpen, openCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
