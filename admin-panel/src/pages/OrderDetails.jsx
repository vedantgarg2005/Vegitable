import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI, menuAPI } from '../services/api';
import toast from 'react-hot-toast';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [chargeType, setChargeType] = useState('delivery');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');

  // Mock order data
  const mockOrder = {
    _id: id,
    orderNumber: 'NDS1703123456789',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 9876543210'
    },
    orderType: 'delivery',
    items: [
      {
        _id: '1',
        menuItem: { name: 'Margherita Pizza', price: 299 },
        quantity: 2,
        price: 299,
        addOns: [{ name: 'Extra Cheese', price: 50 }]
      },
      {
        _id: '2',
        menuItem: { name: 'Garlic Bread', price: 149 },
        quantity: 1,
        price: 149
      }
    ],
    pricing: {
      subtotal: 747,
      tax: 75,
      deliveryFee: 40,
      discount: 0,
      total: 862
    },
    delivery: {
      address: {
        street: '123 Main Street, Apartment 4B',
        landmark: 'Near City Mall',
        city: 'Mumbai',
        pincode: '400001',
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      partner: { name: 'Delivery Partner', phone: '+91 9876543211' },
      estimatedTime: new Date(Date.now() + 30 * 60000),
      instructions: 'Ring the bell twice'
    },
    status: {
      current: 'preparing',
      history: [
        { status: 'placed', timestamp: new Date(Date.now() - 15 * 60000), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 10 * 60000), note: 'Order confirmed' },
        { status: 'preparing', timestamp: new Date(Date.now() - 5 * 60000), note: 'Kitchen started preparation' }
      ]
    },
    payment: {
      method: 'card',
      status: 'completed',
      transactionId: 'TXN123456789'
    },
    createdAt: new Date(Date.now() - 15 * 60000)
  };

  const mockMenuItems = [
    { _id: '1', name: 'Margherita Pizza', price: 299 },
    { _id: '2', name: 'Pepperoni Pizza', price: 349 },
    { _id: '3', name: 'Garlic Bread', price: 149 },
    { _id: '4', name: 'Coke', price: 60 }
  ];

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getOrder(id),
    retry: false,
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuAPI.getItems(),
    retry: false,
  });

  const displayOrder = order || mockOrder;
  const displayMenuItems = menuItems?.data || mockMenuItems;

  const addItemMutation = useMutation({
    mutationFn: (itemData) => ordersAPI.addItemToOrder(id, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success('Item added to order');
      setShowAddItem(false);
      setSelectedItem('');
      setQuantity(1);
    },
    onError: () => toast.error('Failed to add item'),
  });

  const addChargeMutation = useMutation({
    mutationFn: (chargeData) => ordersAPI.addChargeToOrder(id, chargeData),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success('Charge added to order');
      setShowAddCharge(false);
      setChargeType('delivery');
      setChargeAmount('');
      setChargeDescription('');
    },
    onError: () => toast.error('Failed to add charge'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (statusData) => ordersAPI.updateOrderStatus(id, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleAddItem = () => {
    if (!selectedItem) return;
    const item = displayMenuItems.find(i => i._id === selectedItem);
    addItemMutation.mutate({
      menuItem: selectedItem,
      quantity,
      price: item.price
    });
  };

  const handleAddCharge = () => {
    if (!chargeAmount || !chargeDescription) return;
    addChargeMutation.mutate({
      type: chargeType,
      amount: parseFloat(chargeAmount),
      description: chargeDescription
    });
  };

  const statusOptions = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];
  const statusColors = {
    placed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold">Order #{displayOrder.orderNumber}</h1>
          <p className="text-gray-600">Manage order details and delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Item
          </button>
          <button
            onClick={() => setShowAddCharge(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add Charge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{displayOrder.customer.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium">{displayOrder.customer.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{displayOrder.customer.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Order Type</label>
                <p className="font-medium capitalize">{displayOrder.orderType}</p>
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          {displayOrder.orderType === 'delivery' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Location</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Address</label>
                  <p className="font-medium">{displayOrder.delivery.address.street}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Landmark</label>
                    <p className="font-medium">{displayOrder.delivery.address.landmark}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">City</label>
                    <p className="font-medium">{displayOrder.delivery.address.city}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Pincode</label>
                    <p className="font-medium">{displayOrder.delivery.address.pincode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Coordinates</label>
                    <p className="font-medium text-sm">
                      {displayOrder.delivery.address.coordinates.lat}, {displayOrder.delivery.address.coordinates.lng}
                    </p>
                  </div>
                </div>
                {displayOrder.delivery.instructions && (
                  <div>
                    <label className="text-sm text-gray-600">Delivery Instructions</label>
                    <p className="font-medium">{displayOrder.delivery.instructions}</p>
                  </div>
                )}
                <div className="mt-4">
                  <a
                    href={`https://maps.google.com/?q=${displayOrder.delivery.address.coordinates.lat},${displayOrder.delivery.address.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-3">
              {displayOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.menuItem.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.addOns?.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Add-ons: {item.addOns.map(addon => addon.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Current Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[displayOrder.status.current]}`}>
                  {displayOrder.status.current.replace('_', ' ')}
                </span>
              </div>
              <select
                value={displayOrder.status.current}
                onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Status History</h3>
              <div className="space-y-2">
                {displayOrder.status.history.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      <span className="text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.note && <p className="text-gray-600">{item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{displayOrder.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{displayOrder.pricing.tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>₹{displayOrder.pricing.deliveryFee}</span>
              </div>
              {displayOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{displayOrder.pricing.discount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₹{displayOrder.pricing.total}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="capitalize">{displayOrder.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  displayOrder.payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {displayOrder.payment.status}
                </span>
              </div>
              {displayOrder.payment.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="text-sm">{displayOrder.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Item to Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Item</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Choose an item</option>
                  {displayMenuItems.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} - ₹{item.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  disabled={!selectedItem || addItemMutation.isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Item
                </button>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Charge Modal */}
      {showAddCharge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Charge to Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Charge Type</label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="delivery">Delivery Charge</option>
                  <option value="service">Service Charge</option>
                  <option value="packaging">Packaging Charge</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter charge description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCharge}
                  disabled={!chargeAmount || !chargeDescription || addChargeMutation.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Add Charge
                </button>
                <button
                  onClick={() => setShowAddCharge(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;