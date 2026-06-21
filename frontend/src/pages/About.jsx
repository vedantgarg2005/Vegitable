import { Link } from 'react-router-dom';
import { Leaf, Clock, ShieldCheck, Truck, Phone, Mail, MapPin, Share, Share2, AtSign } from 'lucide-react';

const VALUES = [
  { icon: Leaf,       color: '#16a34a', bg: '#f0fdf4', title: '100% Fresh',      desc: 'Sourced directly from local farms every morning. No cold storage, no compromise.' },
  { icon: Clock,      color: '#d97706', bg: '#fffbeb', title: 'Fast Delivery',    desc: 'From farm to your doorstep in under 60 minutes. We respect your time.' },
  { icon: ShieldCheck,color: '#7c3aed', bg: '#faf5ff', title: 'Quality Checked',  desc: 'Every item is handpicked and inspected before it reaches you.' },
  { icon: Truck,      color: '#0284c7', bg: '#f0f9ff', title: 'Free Delivery',    desc: 'Free delivery on orders above ₹199. No hidden charges ever.' },
];

const TEAM = [
  { name: 'Arjun Mehta',   role: 'Founder & CEO',      emoji: '👨‍💼', color: '#f0fdf4' },
  { name: 'Priya Sharma',  role: 'Head of Operations',  emoji: '👩‍💼', color: '#eff6ff' },
  { name: 'Ravi Kumar',    role: 'Supply Chain Lead',   emoji: '👨‍🌾', color: '#fefce8' },
];

const STATS = [
  { value: '50+',   label: 'Farm Partners' },
  { value: '10K+',  label: 'Happy Customers' },
  { value: '60 min',label: 'Avg Delivery Time' },
  { value: '99%',   label: 'Freshness Guarantee' },
];

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6faf7' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#064e3b 0%,#16a34a 60%,#4ade80 100%)', padding: '56px 20px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>🌿</div>
          <h1 style={{ color: 'white', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '0 0 14px', lineHeight: 1.15 }}>Farm Fresh, Every Day</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            We started FreshBasket with a simple belief — everyone deserves fresh, affordable vegetables delivered right to their door.
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#16a34a', borderRadius: 12, padding: '12px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            Shop Now →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 40 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#aaa', fontWeight: 600, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: '0 0 14px' }}>Our Story</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: '0 0 12px' }}>
            FreshBasket was born in 2023 when our founder Arjun noticed that most people in cities had no easy way to get truly fresh produce — everything in supermarkets had been sitting in cold storage for days.
          </p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 }}>
            We partnered with over 50 local farms within 100km of the city to build a same-day supply chain. Today, we deliver to thousands of households daily, and our promise remains the same: if it's not fresh, it's not on our shelves.
          </p>
        </div>

        {/* Values */}
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: '0 0 16px' }}>Why Choose Us</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 40 }}>
          {VALUES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: '0 0 6px' }}>{title}</p>
              <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: '0 0 16px' }}>Meet the Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 40 }}>
          {TEAM.map(m => (
            <div key={m.name} style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>{m.emoji}</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: '0 0 4px' }}>{m.name}</p>
              <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{m.role}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: '0 0 20px' }}>Get in Touch</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: Phone,  color: '#16a34a', bg: '#f0fdf4', label: 'Phone',   value: '+91 98765 43210' },
              { icon: Mail,   color: '#0284c7', bg: '#f0f9ff', label: 'Email',   value: 'hello@freshbasket.in' },
              { icon: MapPin, color: '#dc2626', bg: '#fff1f2', label: 'Address', value: 'Andheri East, Mumbai, Maharashtra 400069' },
            ].map(({ icon: Icon, color, bg, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', margin: 0 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
            {[AtSign, Share, Share2].map((Icon, i) => (
              <button key={i} style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #e5e5e5', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555' }}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
