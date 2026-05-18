const axios = require('axios');

const BASE_URL = process.env.CASHFREE_API_URL.replace(/\/orders$/, '');
const headers = {
  'x-client-id': process.env.CLIENT_ID,
  'x-client-secret': process.env.CLIENT_SECRET,
  'x-api-version': '2023-08-01',
  'Content-Type': 'application/json',
};

async function createCashfreeOrder({ orderId, amount, customerName, customerEmail, customerPhone }) {
  const payload = {
    order_id: orderId,
    order_amount: parseFloat(amount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: String(orderId).substring(0, 50),
      customer_name: customerName || 'Customer',
      customer_email: customerEmail || 'customer@example.com',
      customer_phone: String(customerPhone || '9999999999').replace(/\D/g, '').substring(0, 10).padEnd(10, '0'),
    },
  };
  console.log('[Cashfree] Creating order:', JSON.stringify(payload));
  try {
    const { data } = await axios.post(`${BASE_URL}/orders`, payload, { headers });
    console.log('[Cashfree] Order created:', JSON.stringify(data));
    return data;
  } catch (err) {
    console.log('[Cashfree] Create error:', JSON.stringify(err.response?.data));
    throw err;
  }
}

async function verifyCashfreePayment(orderId) {
  console.log('[Cashfree] Verifying order:', orderId);
  const { data } = await axios.get(`${BASE_URL}/orders/${orderId}`, { headers });
  console.log('[Cashfree] Verify result:', JSON.stringify(data));
  return data;
}

module.exports = { createCashfreeOrder, verifyCashfreePayment };
