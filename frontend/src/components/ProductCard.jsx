import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CachedImage from './CachedImage';

export default function ProductCard({ product }) {
  const { addToCart, updateQty, cart } = useCart();
  const hasVariants = product.variants?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants[0] : null);
  const [showSheet, setShowSheet] = useState(false);

  const price = hasVariants ? Number(selectedVariant.price) : Number(product.price || 0);
  const mrp = hasVariants ? Number(selectedVariant.marketPrice || 0) : Number(product.marketPrice || 0);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const cartKey = hasVariants ? `${product._id}_${selectedVariant.label}` : product._id;
  const cartItem = cart.find(i => (hasVariants ? i.cartKey === cartKey : i._id === product._id));
  const qty = cartItem?.qty || 0;
  const totalInCart = hasVariants
    ? product.variants.reduce((s, v) => {
        const ck = `${product._id}_${v.label}`;
        return s + (cart.find(i => i.cartKey === ck)?.qty || 0);
      }, 0)
    : qty;

  const placeholder = `https://placehold.co/300x300/f0fdf4/16a34a?text=${encodeURIComponent(product.name)}`;

  const handleAdd = () => {
    const item = hasVariants
      ? { ...product, _id: product._id, cartKey, price, selectedVariant, unit: selectedVariant.label }
      : product;
    addToCart(item);
  };

  const handlePlusClick = () => hasVariants ? setShowSheet(true) : handleAdd();
  const handleDec = () => updateQty(cartKey, qty - 1);

  return (
    <>
      <div style={{
        background: 'white', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: `1.5px solid ${totalInCart > 0 ? '#16a34a' : '#efefef'}`,
        boxShadow: totalInCart > 0 ? '0 0 0 3px rgba(22,163,74,0.08), 0 2px 12px rgba(0,0,0,0.07)' : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.2s', cursor: 'default',
      }}
        onMouseEnter={e => { if (totalInCart === 0) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
        onMouseLeave={e => { if (totalInCart === 0) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#efefef'; } }}>

        {/* Image */}
        <div style={{ position: 'relative', background: '#f8fff8', aspectRatio: '1/1', overflow: 'hidden' }}>
          <CachedImage
            src={product.image || placeholder}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s' }}
            onError={e => { e.target.src = placeholder; }}
          />
          {product.isBestseller && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.04em' }}>⭐ BEST</span>
          )}
          {discount > 0 && (
            <span style={{ position: 'absolute', top: 8, right: 8, background: '#ea580c', color: 'white', fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 20 }}>−{discount}%</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </p>
          <p style={{ fontSize: 10, color: '#aaa', fontWeight: 500, margin: 0 }}>
            {hasVariants ? `${product.variants.length} sizes` : product.unit || '\u00a0'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em' }}>₹{price}</span>
              {mrp > price && (
                <span style={{ fontSize: 10, color: '#bbb', textDecoration: 'line-through', marginLeft: 4 }}>₹{mrp}</span>
              )}
            </div>

            {!hasVariants && qty === 0 && (
              <button onClick={handlePlusClick} style={{ background: 'var(--green)', border: 'none', color: 'white', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-green)', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            )}
            {!hasVariants && qty > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--green)', borderRadius: 10, overflow: 'hidden', gap: 0, boxShadow: 'var(--shadow-green)' }}>
                <button onClick={handleDec} style={{ width: 30, height: 30, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{qty}</span>
                <button onClick={handlePlusClick} style={{ width: 30, height: 30, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            )}
            {hasVariants && (
              <button onClick={() => setShowSheet(true)} style={{ background: totalInCart > 0 ? 'var(--green)' : 'white', border: '1.5px solid var(--green)', color: totalInCart > 0 ? 'white' : 'var(--green)', borderRadius: 10, padding: '5px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: totalInCart > 0 ? 'var(--shadow-green)' : 'none', flexShrink: 0 }}>
                {totalInCart > 0 ? `${totalInCart} ▾` : '+ Add'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Variant bottom sheet */}
      {showSheet && hasVariants && (
        <div onClick={() => setShowSheet(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} className="animate-slide-up-sheet"
            style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 36px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 36, height: 4, background: '#e5e5e5', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CachedImage src={product.image || placeholder} alt={product.name}
                  style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }}
                  onError={e => { e.target.src = placeholder; }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{product.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontWeight: 500 }}>Select pack size</p>
                </div>
              </div>
              <button onClick={() => setShowSheet(false)}
                style={{ background: '#f4f4f5', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {product.variants.map(v => {
                const vPrice = Number(v.price || 0);
                const vMrp = Number(v.marketPrice || 0);
                const vDisc = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
                const vCartKey = `${product._id}_${v.label}`;
                const vItem = cart.find(i => i.cartKey === vCartKey);
                const vQty = vItem?.qty || 0;
                return (
                  <div key={v.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${vQty > 0 ? '#16a34a' : 'var(--border)'}`, background: vQty > 0 ? '#f0fdf4' : 'white', transition: 'all 0.15s' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{v.label}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--green)' }}>₹{vPrice}</span>
                        {vMrp > vPrice && (
                          <>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{vMrp}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c' }}>{vDisc}% off</span>
                          </>
                        )}
                      </div>
                    </div>
                    {vQty === 0 ? (
                      <button onClick={() => { setSelectedVariant(v); addToCart({ ...product, cartKey: vCartKey, price: vPrice, selectedVariant: v, unit: v.label }); }}
                        style={{ background: 'var(--green)', border: 'none', color: 'white', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-green)' }}>
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--green)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-green)' }}>
                        <button onClick={() => updateQty(vCartKey, vQty - 1)} style={{ width: 36, height: 36, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span style={{ color: 'white', fontSize: 14, fontWeight: 800, minWidth: 28, textAlign: 'center' }}>{vQty}</span>
                        <button onClick={() => { setSelectedVariant(v); addToCart({ ...product, cartKey: vCartKey, price: vPrice, selectedVariant: v, unit: v.label }); }}
                          style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
