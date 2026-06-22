import { useState } from 'react';
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
  const [showRefund, setShowRefund] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [chargeType, setChargeType] = useState('delivery');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Mock order data
  const mockOrder = {
    _id: id,
    orderNumber: 'VGT1703123456789',
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 9876543210'
    },
    orderType: 'delivery',
    items: [
      {
        _id: '1',
        menuItem: { name: 'Fresh Tomatoes (1kg)', price: 60 },
        quantity: 2,
        price: 60,
        addOns: []
      },
      {
        _id: '2',
        menuItem: { name: 'Spinach Bunch', price: 30 },
        quantity: 1,
        price: 30
      }
    ],
    pricing: {
      subtotal: 150,
      deliveryFee: 30,
      discount: 0,
      total: 180
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
    { _id: '1', name: 'Tomatoes (1kg)', price: 60 },
    { _id: '2', name: 'Spinach Bunch', price: 30 },
    { _id: '3', name: 'Bananas (dozen)', price: 50 },
    { _id: '4', name: 'Apples (1kg)', price: 120 }
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

  const displayOrder = order ?? mockOrder;
  const displayMenuItems = menuItems || mockMenuItems;

  const addItemMutation = useMutation({
    mutationFn: (itemData) => ordersAPI.addItemToOrder(id, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
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

  const refundMutation = useMutation({
    mutationFn: (data) => ordersAPI.refundOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success('Refund issued successfully');
      setShowRefund(false);
      setRefundAmount('');
      setRefundReason('');
    },
    onError: () => toast.error('Failed to issue refund'),
  });

  const handleRefund = () => {
    const parsed = refundAmount ? parseFloat(refundAmount) : null;
    refundMutation.mutate({ amount: parsed, reason: refundReason || 'Refund by admin' });
  };

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

  const handlePrintSlips = () => {
    const o = displayOrder;
    const total = o.pricing.subtotal + o.pricing.deliveryFee - (o.pricing.discount || 0);
    const now = new Date(o.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const row = (label, value, bold = false) =>
      `<tr>
        <td style="padding:5px 4px;border-bottom:1px solid #eee;${bold ? 'font-weight:700;font-size:15px' : ''}">${label}</td>
        <td style="padding:5px 4px;border-bottom:1px solid #eee;text-align:right;${bold ? 'font-weight:700;font-size:15px' : ''}">${value}</td>
      </tr>`;

    const customerSlip = `
      <div class="slip">
        <div class="header">
          <div class="brand">🥬 FreshBasket</div>
          <div class="slip-label">CUSTOMER BILL</div>
          <div class="meta">${dateStr} &nbsp;|&nbsp; ${timeStr}</div>
        </div>
        <div class="divider"></div>
        <table class="info-table">
          <tr><td class="label">Order No.</td><td class="value">#${o.orderNumber}</td></tr>
          <tr><td class="label">Name</td><td class="value">${o.customer.name}</td></tr>
          <tr><td class="label">Phone</td><td class="value">${o.customer.phone}</td></tr>
          <tr><td class="label">Type</td><td class="value type-badge">${o.orderType.toUpperCase()}</td></tr>
          ${o.orderType === 'delivery' ? `<tr><td class="label">Address</td><td class="value">${o.delivery.address.street},<br>${o.delivery.address.city} – ${o.delivery.address.pincode}</td></tr>` : ''}
        </table>
        <div class="divider dashed"></div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${o.items.map(item => `
              <tr>
                <td>${item.menuItem.name}${item.addOns?.length ? '<div class="addon">+ ' + item.addOns.map(a => a.name).join(', ') + '</div>' : ''}</td>
                <td style="text-align:center">${item.quantity}</td>
                <td style="text-align:right">&#8377;${item.price * item.quantity}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="divider dashed"></div>
        <table class="totals-table">
          ${row('Subtotal', '&#8377;' + o.pricing.subtotal)}
          ${row('Delivery Fee', '&#8377;' + o.pricing.deliveryFee)}
          ${o.pricing.discount > 0 ? `<tr><td style="padding:5px 4px;border-bottom:1px solid #eee;color:#16a34a">Discount</td><td style="padding:5px 4px;border-bottom:1px solid #eee;text-align:right;color:#16a34a">-&#8377;${o.pricing.discount}</td></tr>` : ''}
          ${row('TOTAL', '&#8377;' + total, true)}
        </table>
        <div class="divider"></div>
        <div class="payment-row">
          <span>Payment: <b>${o.payment.method.toUpperCase()}</b></span>
          <span class="paid-badge">${o.payment.status.toUpperCase()}</span>
        </div>
        ${o.payment.transactionId ? `<div class="txn">Txn ID: ${o.payment.transactionId}</div>` : ''}
        <div class="footer">Thank you for shopping with us! 🙏<br><span>Fresh & healthy, delivered to your door</span></div>
      </div>`;

    const chefSlip = `
      <div class="slip chef">
        <div class="header">
          <div class="brand">📦 PACKING ORDER</div>
          <div class="slip-label">CHEF COPY</div>
          <div class="meta">${dateStr} &nbsp;|&nbsp; ${timeStr}</div>
        </div>
        <div class="divider"></div>
        <table class="info-table">
          <tr><td class="label">Order No.</td><td class="value order-num">#${o.orderNumber}</td></tr>
          <tr><td class="label">Type</td><td class="value type-badge">${o.orderType.toUpperCase()}</td></tr>
          ${o.orderType === 'delivery' && o.delivery?.instructions ? `<tr><td class="label">Note</td><td class="value note">${o.delivery.instructions}</td></tr>` : ''}
        </table>
        <div class="divider dashed"></div>
        <table class="chef-items">
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th style="text-align:right">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${o.items.map(item => `
              <tr>
                <td>${item.menuItem.name}${item.addOns?.length ? '<div class="addon">+ ' + item.addOns.map(a => a.name).join(', ') + '</div>' : ''}</td>
                <td class="qty-big">${item.quantity}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="status-box">STATUS: ${o.status.current.replace(/_/g, ' ').toUpperCase()}</div>
        <div class="footer">Pack with care 📦</div>
      </div>`;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; background: #f3f4f6; }
      .slip {
        width: 320px; margin: 0 auto; background: #fff;
        padding: 24px 20px; border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      }
      .slip.chef { border-top: 5px solid #f97316; }
      .slip:not(.chef) { border-top: 5px solid #2563eb; }
      .header { text-align: center; margin-bottom: 12px; }
      .brand { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
      .slip-label {
        display: inline-block; font-size: 11px; font-weight: 700;
        letter-spacing: 2px; padding: 2px 10px; border-radius: 20px;
        background: #eff6ff; color: #2563eb; margin-bottom: 4px;
      }
      .chef .slip-label { background: #fff7ed; color: #f97316; }
      .meta { font-size: 11px; color: #6b7280; }
      .divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 12px 0; }
      .divider.dashed { border-top-style: dashed; border-color: #d1d5db; }
      .info-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 4px; }
      .info-table td { padding: 3px 2px; vertical-align: top; }
      .info-table .label { color: #6b7280; width: 80px; }
      .info-table .value { font-weight: 600; color: #111827; }
      .info-table .order-num { font-size: 15px; font-weight: 700; }
      .info-table .note { color: #dc2626; font-weight: 600; }
      .type-badge {
        display: inline-block; font-size: 10px; font-weight: 700;
        padding: 1px 8px; border-radius: 20px;
        background: #dcfce7; color: #16a34a;
      }
      .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .items-table th { font-size: 11px; color: #6b7280; font-weight: 600; padding: 4px 2px; border-bottom: 1.5px solid #e5e7eb; }
      .items-table td { padding: 6px 2px; border-bottom: 1px solid #f3f4f6; color: #111827; }
      .addon { font-size: 10.5px; color: #6b7280; margin-top: 2px; }
      .totals-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .payment-row { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; margin-top: 10px; }
      .paid-badge {
        font-size: 10px; font-weight: 700; padding: 2px 8px;
        border-radius: 20px; background: #dcfce7; color: #16a34a;
      }
      .txn { font-size: 10.5px; color: #9ca3af; margin-top: 4px; }
      .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #6b7280; line-height: 1.6; }
      .footer span { font-size: 11px; }
      .chef-items { width: 100%; border-collapse: collapse; font-size: 14px; }
      .chef-items th { font-size: 11px; color: #6b7280; font-weight: 600; padding: 4px 2px; border-bottom: 1.5px solid #e5e7eb; }
      .chef-items td { padding: 8px 2px; border-bottom: 1px solid #f3f4f6; }
      .qty-big { text-align: right; font-size: 26px; font-weight: 800; color: #f97316; }
      .status-box {
        text-align: center; font-size: 13px; font-weight: 700;
        letter-spacing: 1.5px; padding: 8px; border-radius: 6px;
        background: #fff7ed; color: #f97316; border: 1.5px dashed #f97316;
        margin-top: 4px;
      }
      @media print {
        body { background: #fff; }
        .slip { box-shadow: none; border-radius: 0; }
        .page { page-break-after: always; display: flex; justify-content: center; align-items: flex-start; padding: 20px; min-height: 100vh; }
        .page:last-child { page-break-after: avoid; }
      }
    `;

    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Slips — ${o.orderNumber}</title>
        <style>${styles}</style>
      </head><body>
        <div class="page" style="display:flex;justify-content:center;align-items:flex-start;padding:24px;min-height:100vh;background:#f3f4f6">
          ${customerSlip}
        </div>
        <div class="page" style="display:flex;justify-content:center;align-items:flex-start;padding:24px;min-height:100vh;background:#f3f4f6">
          ${chefSlip}
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body></html>`);
    win.document.close();
  };

  const statusOptions = ['placed', 'confirmed', 'processing', 'packed', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];
  const statusColors = {
    placed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-purple-100 text-purple-800',
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
            disabled={displayOrder.status.current === 'delivered'}
            title={displayOrder.status.current === 'delivered' ? 'Order already delivered' : ''}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Item
          </button>
          <button
            onClick={() => setShowAddCharge(true)}
            disabled={displayOrder.status.current === 'delivered'}
            title={displayOrder.status.current === 'delivered' ? 'Order already delivered' : ''}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Charge
          </button>
          <button
            onClick={handlePrintSlips}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
          >
            🖨️ Print Slips
          </button>
          {displayOrder.payment.status !== 'refunded' && (
            <button
              onClick={() => {
                setRefundAmount(String(displayOrder.pricing.subtotal + displayOrder.pricing.deliveryFee - (displayOrder.pricing.discount || 0)));
                setShowRefund(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              💸 Refund
            </button>
          )}
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
                  {displayOrder.delivery?.address?.coordinates && (
                  <div>
                    <label className="text-sm text-gray-600">Coordinates</label>
                    <p className="font-medium text-sm">
                      {displayOrder.delivery.address.coordinates.lat}, {displayOrder.delivery.address.coordinates.lng}
                    </p>
                  </div>
                  )}
                </div>
                {displayOrder.delivery.instructions && (
                  <div>
                    <label className="text-sm text-gray-600">Delivery Instructions</label>
                    <p className="font-medium">{displayOrder.delivery.instructions}</p>
                  </div>
                )}
                {displayOrder.delivery?.address?.coordinates && (
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
                )}
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
                    <p className="font-medium">{item.menuItem?.name ?? 'Deleted Item'}</p>
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
              {displayOrder.orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₹{displayOrder.pricing.deliveryFee}</span>
                </div>
              )}
              {displayOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{displayOrder.pricing.discount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₹{displayOrder.pricing.subtotal + displayOrder.pricing.deliveryFee - (displayOrder.pricing.discount || 0)}</span>
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
            {displayOrder.payment.status === 'refunded' && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium text-center">
                ✅ Refund Issued
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-1">Issue Refund</h3>
            <p className="text-sm text-gray-500 mb-4">Amount will be credited to the customer's wallet.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Wrong item delivered"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={!refundAmount || refundMutation.isLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {refundMutation.isLoading ? 'Processing...' : 'Confirm Refund'}
                </button>
                <button
                  onClick={() => setShowRefund(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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