import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fleetAPI } from '../services/api';
import { showMessage } from 'react-native-flash-message';

const FleetContext = createContext();

const initialState = {
  drivers: [],
  activeOrders: [],
  deliveryStats: {},
  loading: false,
  error: null,
};

function fleetReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DRIVERS':
      return { ...state, drivers: action.payload };
    case 'SET_ACTIVE_ORDERS':
      return { ...state, activeOrders: action.payload };
    case 'SET_DELIVERY_STATS':
      return { ...state, deliveryStats: action.payload };
    case 'UPDATE_DRIVER_STATUS':
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver.id === action.payload.driverId
            ? { ...driver, status: action.payload.status, location: action.payload.location }
            : driver
        ),
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        activeOrders: state.activeOrders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        ),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function FleetProvider({ children }) {
  const [state, dispatch] = useReducer(fleetReducer, initialState);

  useEffect(() => {
    loadFleetData();
    const interval = setInterval(loadFleetData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadFleetData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [driversRes, ordersRes, statsRes] = await Promise.all([
        fleetAPI.getDrivers(),
        fleetAPI.getActiveOrders(),
        fleetAPI.getDeliveryStats(),
      ]);
      
      dispatch({ type: 'SET_DRIVERS', payload: driversRes.data });
      dispatch({ type: 'SET_ACTIVE_ORDERS', payload: ordersRes.data });
      dispatch({ type: 'SET_DELIVERY_STATS', payload: statsRes.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      const response = await fleetAPI.assignDriver({ orderId, driverId });
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: 'assigned' } });
      showMessage({
        message: 'Driver assigned successfully',
        type: 'success',
      });
      return { success: true };
    } catch (error) {
      showMessage({
        message: error.response?.data?.message || 'Failed to assign driver',
        type: 'danger',
      });
      return { success: false };
    }
  };

  const updateDriverLocation = async (driverId, location) => {
    try {
      await fleetAPI.updateDriverLocation({ driverId, location });
      dispatch({
        type: 'UPDATE_DRIVER_STATUS',
        payload: { driverId, location },
      });
    } catch (error) {
      console.error('Failed to update driver location:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fleetAPI.updateOrderStatus({ orderId, status });
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
      showMessage({
        message: `Order status updated to ${status}`,
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Failed to update order status',
        type: 'danger',
      });
    }
  };

  const value = {
    ...state,
    assignDriver,
    updateDriverLocation,
    updateOrderStatus,
    loadFleetData,
  };

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}