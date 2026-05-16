import React, { createContext, useContext, useReducer } from 'react';
import { reviewAPI } from '../services/api';
import { showMessage } from 'react-native-flash-message';

const ReviewContext = createContext();

const initialState = {
  reviews: [],
  restaurantReviews: {},
  userReviews: [],
  loading: false,
  error: null,
};

function reviewReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REVIEWS':
      return { ...state, reviews: action.payload };
    case 'SET_RESTAURANT_REVIEWS':
      return { 
        ...state, 
        restaurantReviews: { 
          ...state.restaurantReviews, 
          [action.payload.restaurantId]: action.payload.reviews 
        } 
      };
    case 'SET_USER_REVIEWS':
      return { ...state, userReviews: action.payload };
    case 'ADD_REVIEW':
      return { 
        ...state, 
        reviews: [action.payload, ...state.reviews],
        userReviews: [action.payload, ...state.userReviews]
      };
    case 'UPDATE_REVIEW':
      return {
        ...state,
        reviews: state.reviews.map(review =>
          review.id === action.payload.id ? action.payload : review
        ),
        userReviews: state.userReviews.map(review =>
          review.id === action.payload.id ? action.payload : review
        ),
      };
    case 'DELETE_REVIEW':
      return {
        ...state,
        reviews: state.reviews.filter(review => review.id !== action.payload),
        userReviews: state.userReviews.filter(review => review.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function ReviewProvider({ children }) {
  const [state, dispatch] = useReducer(reviewReducer, initialState);

  const getRestaurantReviews = async (restaurantId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reviewAPI.getRestaurantReviews(restaurantId);
      dispatch({ 
        type: 'SET_RESTAURANT_REVIEWS', 
        payload: { restaurantId, reviews: response.data } 
      });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getUserReviews = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reviewAPI.getUserReviews();
      dispatch({ type: 'SET_USER_REVIEWS', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitReview = async (reviewData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await reviewAPI.submitReview(reviewData);
      dispatch({ type: 'ADD_REVIEW', payload: response.data });
      showMessage({
        message: 'Review submitted successfully',
        type: 'success',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit review';
      dispatch({ type: 'SET_ERROR', payload: message });
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateReview = async (reviewId, reviewData) => {
    try {
      const response = await reviewAPI.updateReview(reviewId, reviewData);
      dispatch({ type: 'UPDATE_REVIEW', payload: response.data });
      showMessage({
        message: 'Review updated successfully',
        type: 'success',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update review';
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await reviewAPI.deleteReview(reviewId);
      dispatch({ type: 'DELETE_REVIEW', payload: reviewId });
      showMessage({
        message: 'Review deleted successfully',
        type: 'success',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete review';
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    }
  };

  const value = {
    ...state,
    getRestaurantReviews,
    getUserReviews,
    submitReview,
    updateReview,
    deleteReview,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}