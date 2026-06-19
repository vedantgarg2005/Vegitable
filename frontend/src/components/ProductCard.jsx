import { Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart, updateQty, cart } = useCart();
  const cartItem = cart.find(i => i._id === product._id);
  const qty = cartItem?.qty || 0;
  const [showPopup, setShowPopup] = useState(false);

  const basePrice = product.variants?.length > 0 ? Number(product.variants[0].price) : Number(product.price || 0);
  const actualPrice = basePrice + 5;
  const discount = Math.round((5 / actualPrice) * 100);

  const vegEmojis = { vegetables: '🥦', fruits: '🍎', leafy: '🥗', exotic: '🥭', herbs: '🌿', organic: '🌱' };
  const placeholder = `https://placehold.co/300x200/E8F5E9/2E7D32?text=${encodeURIComponent(product.name)}`;

  return (
    <>
      <div style={{
        background: 'white', borderRadius: 18, overflow: 'hidden',
        boxShadow: qty > 0 ? '0 4px 20px rgba(46,125,50,0.18)' : '0 2px 10px rgba(0,0,0,0.06)',
        border: qty > 0 ? '2px solid #4CAF50' : '1.5px solid #F0F0F0',
        display: 'flex', flexDirection: 'column', transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        cursor: 'default', transform: qty > 0 ? 'translateY(-2px)' : 'none',
      }}
        onMouseEnter={e => { if (qty === 0) e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = qty > 0 ? 'translateY(-2px)' : 'none'; e.currentTarget.style.boxShadow = qty > 0 ? '0 4px 20px rgba(46,125,50,0.18)' : '0 2px 10px rgba(0,0,0,0.06)'; }}
      >
        {/* Image */}
        <div style={{ position: 'relative', background: '#F6FAF6' }}>
          <img
            src={product.image || placeholder}
            alt={product.name}
            style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
            onError={e => { e.target.src = placeholder; }}
          />
          {!product.image && (
            <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 28, opacity: 0.3 }}>
              {vegEmojis[product.category] || '🛒'}
            </span>
          )}
          {discount > 0 && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              background: '#E53935', color: 'white', fontSize: 10, fontWeight: 800,
              padding: '2px 7px', borderRadius: 6,
            }}>
              {discount}% OFF
            </span>
          )}
          {product.isBestseller && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: '#FFF8E1', color: '#F57F17', fontSize: 10, fontWeight: 800,
              padding: '2px 7px', borderRadius: 6,
            }}>
              ⭐ Best
            </span>
          )}
          {qty > 0 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#2E7D32,#66BB6A)' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px', lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </p>
          {product.unit && (
            <p style={{ fontSize: 11, color: '#aaa', fontWeight: 600, margin: '0 0 8px' }}>{product.unit}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#1B3A1F' }}>₹{basePrice}</span>
              <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through', marginLeft: 4 }}>₹{actualPrice}</span>
            </div>

            {qty === 0 ? (
              <button
                onClick={() => { addToCart(product); setShowPopup(true); }}
                style={{
                  background: 'white', border: '2px solid #2E7D32', color: '#2E7D32',
                  borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2E7D32'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#2E7D32'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Plus size={12} /> ADD
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', background: '#2E7D32', borderRadius: 10, overflow: 'hidden', animation: 'popIn 0.2s ease' }}>
                <button
                  onClick={() => updateQty(product._id, qty - 1)}
                  style={{ width: 28, height: 28, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Minus size={12} />
                </button>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                <button
                  onClick={() => addToCart(product)}
                  style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Sheet */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(2px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-slide-up-sheet"
            style={{
              background: 'white', borderRadius: '22px 22px 0 0',
              padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
              width: '100%', maxWidth: 480,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 18px' }} />

            {/* Close */}
            <button
              onClick={() => setShowPopup(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#f5f5f5', border: 'none', cursor: 'pointer', color: '#888', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#eee'}
              onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}
            >
              <X size={16} />
            </button>

            {/* Product row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <img
                src={product.image || placeholder}
                alt={product.name}
                style={{ width: 68, height: 68, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid #f0f0f0' }}
                onError={e => { e.target.src = placeholder; }}
              />
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>{product.name}</p>
                {product.unit && <p style={{ fontSize: 12, color: '#888', fontWeight: 600, margin: '0 0 4px' }}>{product.unit}</p>}
                <p style={{ fontSize: 14, fontWeight: 900, color: '#1B3A1F', margin: 0 }}>₹{basePrice}</p>
              </div>
            </div>

            {/* Qty row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F4FBF4', borderRadius: 14, padding: '10px 16px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#444' }}>Quantity</span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#2E7D32', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => { updateQty(product._id, qty - 1); if (qty - 1 <= 0) setShowPopup(false); }}
                  style={{ width: 38, height: 38, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ color: 'white', fontSize: 16, fontWeight: 900, minWidth: 32, textAlign: 'center' }}>{qty}</span>
                <button
                  onClick={() => addToCart(product)}
                  style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
