import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems;
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      AsyncStorage.setItem('cart', JSON.stringify(newState));
      return newState;
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      AsyncStorage.setItem('cart', JSON.stringify(newState));
      return newState;
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: id });
      }
      
      const newItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      
      const newState = {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      AsyncStorage.setItem('cart', JSON.stringify(newState));
      return newState;
    }
    case 'CLEAR_CART': {
      const newState = initialState;
      AsyncStorage.removeItem('cart');
      return newState;
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        dispatch({ type: 'SET_CART', payload: JSON.parse(cartData) });
      }
    } catch (error) {
      console.log('Error loading cart:', error);
    }
  };

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id: item.id || item._id } });
    showMessage({
      message: 'Item added to cart',
      type: 'success',
      duration: 2000,
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    showMessage({
      message: 'Item removed from cart',
      type: 'info',
      duration: 2000,
    });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
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