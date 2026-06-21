import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addToCart, updateQty, cart } = useCart();
  const hasVariants = product.variants?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants[0] : null);

  const price = hasVariants ? Number(selectedVariant.price) : Number(product.price || 0);
  const mrp = hasVariants ? Number(selectedVariant.marketPrice || 0) : Number(product.marketPrice || 0);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const cartKey = hasVariants ? `${product._id}_${selectedVariant.label}` : product._id;
  const cartItem = cart.find(i => (hasVariants ? i.cartKey === cartKey : i._id === product._id));
  const qty = cartItem?.qty || 0;

  const placeholder = `https://placehold.co/300x300/f0fdf4/16a34a?text=${encodeURIComponent(product.name)}`;

  const handleAdd = () => {
    const item = hasVariants
      ? { ...product, _id: product._id, cartKey, price, selectedVariant, unit: selectedVariant.label }
      : product;
    addToCart(item);
  };

  const handleInc = () => handleAdd();
  const handleDec = () => updateQty(cartKey, qty - 1);

  return (
    <div style={{ background: 'white', borderRadius: 14, border: qty > 0 ? '1.5px solid #16a34a' : '1.5px solid #f0f0f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s, border-color 0.15s', boxShadow: qty > 0 ? '0 0 0 3px #dcfce7' : '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Image */}
      <Link to={`/product/${product._id}`} style={{ display: 'block', position: 'relative', background: '#f8fffe', aspectRatio: '1/1', overflow: 'hidden' }}>
        <img
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
      </Link>

      {/* Info */}
      <div style={{ padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        {product.unit && <p style={{ fontSize: 11, color: '#bbb', fontWeight: 500, margin: 0 }}>{product.unit}</p>}

      {/* Variants */}
        {hasVariants && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
            {product.variants.map(v => (
              <button
                key={v.label}
                onClick={() => setSelectedVariant(v)}
                style={{ padding: '3px 9px', borderRadius: 6, border: '1.5px solid', borderColor: selectedVariant.label === v.label ? '#16a34a' : '#e5e5e5', background: selectedVariant.label === v.label ? '#f0fdf4' : 'white', color: selectedVariant.label === v.label ? '#16a34a' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

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

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
              <Plus size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#16a34a', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={handleDec}
                style={{ width: 28, height: 28, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{qty}</span>
              <button onClick={handleInc}
                style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
