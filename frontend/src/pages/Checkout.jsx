import { Navigate } from 'react-router-dom';

// Checkout is handled by CartDrawer — redirect to home
export default function Checkout() {
  return <Navigate to="/" replace />;
}
