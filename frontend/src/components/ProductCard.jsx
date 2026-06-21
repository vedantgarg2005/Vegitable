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

  const handlePlusClick = () => {
    if (hasVariants) { setShowSheet(true); }
    else handleAdd();
  };

  const handleDec = () => updateQty(cartKey, qty - 1);

  return (
    <>
    <div style={{ background: 'white', borderRadius: 14, border: totalInCart > 0 ? '1.5px solid #16a34a' : '1.5px solid #f0f0f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s, border-color 0.15s', boxShadow: totalInCart > 0 ? '0 0 0 3px #dcfce7' : '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Image */}
      <div style={{ display: 'block', position: 'relative', background: '#f8fffe', aspectRatio: '1/1', overflow: 'hidden' }}>
        <CachedImage
          src={product.image || placeholder}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = placeholder; }}
        />
        {product.isBestseller && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: '#16a34a', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20 }}>⭐ TOP</span>
        )}
        {discount > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: '#ea580c', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20 }}>-{discount}%</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        {product.unit && !hasVariants && <p style={{ fontSize: 11, color: '#bbb', fontWeight: 500, margin: 0 }}>{product.unit}</p>}
        {hasVariants && <p style={{ fontSize: 11, color: '#bbb', fontWeight: 500, margin: 0 }}>{product.variants.length} sizes</p>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0a0a0a' }}>₹{price}</span>
            {mrp > price && (
              <>
                <span style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through', marginLeft: 5 }}>₹{mrp}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', marginLeft: 4 }}>{discount}% off</span>
              </>
            )}
          </div>

          {!hasVariants && qty === 0 && (
            <button onClick={handlePlusClick}
              style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
              <Plus size={15} strokeWidth={2.5} />
            </button>
          )}
          {!hasVariants && qty > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#16a34a', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={handleDec} style={{ width: 28, height: 28, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{qty}</span>
              <button onClick={handlePlusClick} style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
          {hasVariants && (
            <button onClick={() => setShowSheet(true)}
              style={{ background: totalInCart > 0 ? '#16a34a' : 'white', border: '1.5px solid #16a34a', color: totalInCart > 0 ? 'white' : '#16a34a', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              {totalInCart > 0 ? `${totalInCart} ▾` : '+ Add'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Pack size bottom sheet */}
    {showSheet && hasVariants && (
      <div
        onClick={() => setShowSheet(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}>
        <div
          onClick={e => e.stopPropagation()}
          className="animate-slide-up-sheet"
          style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 20px 32px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CachedImage src={product.image || placeholder} alt={product.name}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid #f0f0f0' }}
                onError={e => { e.target.src = placeholder; }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0, lineHeight: 1.3 }}>{product.name}</p>
                <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontWeight: 600 }}>Select pack size</p>
              </div>
            </div>
            <button onClick={() => setShowSheet(false)}
              style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          {/* Variant rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {product.variants.map(v => {
              const vPrice = Number(v.price || 0);
              const vMrp = Number(v.marketPrice || 0);
              const vDisc = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
              const vCartKey = `${product._id}_${v.label}`;
              const vItem = cart.find(i => i.cartKey === vCartKey);
              const vQty = vItem?.qty || 0;
              return (
                <div key={v.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: vQty > 0 ? '1.5px solid #16a34a' : '1.5px solid #f0f0f0', background: vQty > 0 ? '#f0fdf4' : 'white' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>{v.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#16a34a' }}>₹{vPrice}</span>
                      {vMrp > vPrice && (
                        <>
                          <span style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>₹{vMrp}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c' }}>{vDisc}% off</span>
                        </>
                      )}
                    </div>
                  </div>
                  {vQty === 0 ? (
                    <button
                      onClick={() => { setSelectedVariant(v); addToCart({ ...product, cartKey: vCartKey, price: vPrice, selectedVariant: v, unit: v.label }); }}
                      style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#16a34a', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => updateQty(vCartKey, vQty - 1)} style={{ width: 32, height: 32, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span style={{ color: 'white', fontSize: 14, fontWeight: 800, minWidth: 26, textAlign: 'center' }}>{vQty}</span>
                      <button onClick={() => { setSelectedVariant(v); addToCart({ ...product, cartKey: vCartKey, price: vPrice, selectedVariant: v, unit: v.label }); }} style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} strokeWidth={2.5} />
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
