import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react';

const FAQS = [
  { q: '📦 How do I track my order?', a: 'Go to My Orders in the profile menu → tap your active order to see live status updates.' },
  { q: '❌ Can I cancel my order?', a: 'Orders can be cancelled within 2 minutes of placing. Open the order detail page and tap Cancel Order.' },
  { q: '💰 How does the wallet work?', a: 'Add money to your Fresh Tokri Wallet and use it at checkout. Refunds are also credited here automatically.' },
  { q: '🔄 I received a wrong / damaged item', a: "We're sorry! Please contact us within 30 minutes of delivery with a photo. We'll arrange a replacement or full refund." },
  { q: '🎟️ How do I apply a promo code?', a: 'On the Cart page, scroll down to "Have a promo code?" and enter your code. Valid codes are applied instantly.' },
  { q: '🚚 What are the delivery charges?', a: 'Orders above ₹299 get FREE delivery. A small delivery fee based on distance applies for smaller orders.' },
  { q: '🕐 What are your delivery hours?', a: 'We deliver from 7 AM to 10 PM every day including weekends and public holidays.' },
  { q: '♻️ How do I return a product?', a: "We accept returns for damaged or incorrect items within 24 hours. Contact support and we'll arrange a pickup." },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#f6faf7', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={17} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0a0a0a' }}>Help Center</h1>
        </div>

        {/* Hero banner */}
        <div style={{ background: 'linear-gradient(135deg,#064e3b,#16a34a)', borderRadius: 20, padding: '28px 24px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌿</div>
          <p style={{ color: 'white', fontWeight: 900, fontSize: 18, margin: '0 0 6px' }}>How can we help?</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Find quick answers below or reach out to us directly.</p>
        </div>

        {/* FAQs */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', overflow: 'hidden', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 18px 10px', margin: 0, borderBottom: '1px solid #f5f5f5' }}>
            Frequently Asked Questions
          </p>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{ borderBottom: i < FAQS.length - 1 ? '1px solid #f5f5f5' : 'none' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#16a34a', marginLeft: 12, flexShrink: 0, transition: 'transform 0.2s', transform: openIndex === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openIndex === i && (
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, padding: '0 18px 16px' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact options */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Still need help?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Phone,         color: '#16a34a', bg: '#f0fdf4', label: 'Call Us',    sub: '+91 98765 43210',          href: 'tel:+919876543210' },
              { icon: MessageCircle, color: '#25D366', bg: '#f0fdf4', label: 'WhatsApp',   sub: 'Chat with us instantly',   href: 'https://wa.me/919876543210' },
              { icon: Mail,          color: '#0284c7', bg: '#f0f9ff', label: 'Email',      sub: 'support@freshtokri.in',   href: 'mailto:support@freshtokri.in' },
            ].map(({ icon: Icon, color, bg, label, sub, href }) => (
              <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, border: '1px solid #f0f0f0', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
