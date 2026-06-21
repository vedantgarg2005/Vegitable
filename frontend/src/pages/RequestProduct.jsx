import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RequestProduct() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/product-requests', { productName: productName.trim(), description: description.trim() });
      toast.success("Request submitted! We'll try to add it soon 🌿");
      setProductName('');
      setDescription('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6faf7', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={17} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0a0a0a' }}>Request a Product</h1>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackagePlus size={24} color="#16a34a" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, margin: '0 0 3px', color: '#0a0a0a' }}>Can't find what you need?</p>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Tell us and we'll try to source it for you.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Dragon Fruit, Jackfruit..."
                value={productName}
                onChange={e => setProductName(e.target.value)}
                maxLength={100}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Description (optional)
              </label>
              <textarea
                placeholder="Any specific details, variant, quantity preference..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={300}
                rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
              <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0', textAlign: 'right' }}>{description.length}/300</p>
            </div>

            <button
              type="submit"
              disabled={!productName.trim() || submitting}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: productName.trim() ? '#16a34a' : '#d1d5db',
                color: 'white', fontSize: 15, fontWeight: 800, cursor: productName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 20 }}>
          Our team reviews all requests and aims to add new products within 7 days.
        </p>
      </div>
    </div>
  );
}
