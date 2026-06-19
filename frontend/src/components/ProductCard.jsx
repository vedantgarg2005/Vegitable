import { Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart, updateQty, cart } = useCart();
  const cartItem = cart.find(i => i._id === product._id);
  const qty = cartItem?.qty || 0;
  const [showPopup, setShowPopup] = useState(false);

  const basePrice = product.variants?.length > 0 ? Number(product.variants[0].price) : Number(product.price || 0);
  const placeholder = `https://placehold.co/300x200/f5f5f5/999999?text=${encodeURIComponent(product.name)}`;

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        border: qty > 0 ? '1.5px solid #0a0a0a' : '1.5px solid #e5e5e5',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}>
        {/* Image */}
        <div style={{ position: 'relative', background: '#f9f9f9' }}>
          <img
            src={product.image || placeholder}
            alt={product.name}
            style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.src = placeholder; }}
          />
          {product.isBestseller && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>
              BEST SELLER
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', margin: '0 0 2px', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </p>
          {product.unit && (
            <p style={{ fontSize: 11, color: '#bbb', fontWeight: 500, margin: '0 0 8px' }}>{product.unit}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a' }}>₹{basePrice}</span>

            {qty === 0 ? (
              <button
                onClick={() => { addToCart(product); setShowPopup(true); }}
                style={{ background: 'white', border: '1.5px solid #e5e5e5', color: '#0a0a0a', borderRadius: 6, padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e5e5'}
              >
                <Plus size={11} /> ADD
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0a', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => updateQty(product._id, qty - 1)}
                  style={{ width: 26, height: 26, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={11} />
                </button>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 800, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => addToCart(product)}
                  style={{ width: 26, height: 26, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Sheet */}
      {showPopup && (
        <div onClick={() => setShowPopup(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} className="animate-slide-up-sheet"
            style={{ background: 'white', borderRadius: '14px 14px 0 0', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))', width: '100%', maxWidth: 480 }}>
            <div style={{ width: 32, height: 3, borderRadius: 2, background: '#e5e5e5', margin: '0 auto 18px' }} />

            <button onClick={() => setShowPopup(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#f5f5f5', border: 'none', cursor: 'pointer', color: '#888', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <img src={product.image || placeholder} alt={product.name}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e5e5' }}
                onError={e => { e.target.src = placeholder; }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', margin: '0 0 4px' }}>{product.name}</p>
                {product.unit && <p style={{ fontSize: 12, color: '#999', fontWeight: 500, margin: '0 0 4px' }}>{product.unit}</p>}
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>₹{basePrice}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: 8, padding: '10px 16px', border: '1px solid #e5e5e5' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>Quantity</span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0a', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => { updateQty(product._id, qty - 1); if (qty - 1 <= 0) setShowPopup(false); }}
                  style={{ width: 36, height: 36, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={13} />
                </button>
                <span style={{ color: 'white', fontSize: 15, fontWeight: 800, minWidth: 30, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => addToCart(product)}
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
