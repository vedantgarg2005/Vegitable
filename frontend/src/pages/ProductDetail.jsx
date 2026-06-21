import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus, Star, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { cart, addToCart, updateQty } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/products`).then(({ data }) => {
      const list = Array.isArray(data) ? data : data.products || [];
      const p = list.find(x => x._id === id);
      setProduct(p || null);
      if (p) {
        if (p.variants?.length) setSelectedVariant(p.variants[0]);
        setRelated(list.filter(x => x._id !== id && x.category === p.category && x.isActive !== false).slice(0, 6));
      }
    }).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div className="skeleton" style={{ height: 320, borderRadius: 20, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 8 }} />
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>😕</p>
      <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 16px' }}>Product not found</p>
      <Link to="/" style={{ color: '#16a34a', fontWeight: 700 }}>← Back to Home</Link>
    </div>
  );

  const hasVariants = product.variants?.length > 0;
  const price = hasVariants ? Number(selectedVariant?.price || 0) : Number(product.price || 0);
  const mrp = hasVariants ? Number(selectedVariant?.marketPrice || 0) : Number(product.marketPrice || 0);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const cartKey = hasVariants ? `${product._id}_${selectedVariant?.label}` : product._id;
  const cartItem = cart.find(i => (i.cartKey || i._id) === cartKey);
  const qty = cartItem?.qty || 0;
  const placeholder = `https://placehold.co/600x600/f0fdf4/16a34a?text=${encodeURIComponent(product.name)}`;

  const handleAdd = () => {
    const item = hasVariants
      ? { ...product, cartKey, price, selectedVariant, unit: selectedVariant?.label }
      : product;
    addToCart(item);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6faf7' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 80px' }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft size={15} /> Back
        </Link>

        {/* Image */}
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 16, position: 'relative' }}>
          <img
            src={product.image || placeholder}
            alt={product.name}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.src = placeholder; }}
          />
          {product.isBestseller && (
            <span style={{ position: 'absolute', top: 12, left: 12, background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>⭐ Bestseller</span>
          )}
          {discount > 0 && (
            <span style={{ position: 'absolute', top: 12, right: 12, background: '#ea580c', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{discount}% OFF</span>
          )}
        </div>

        {/* Info */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0a0a0a', margin: 0, lineHeight: 1.3 }}>{product.name}</h1>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: 0 }}>₹{price}</p>
              {mrp > price && (
                <>
                  <p style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through', margin: '2px 0 0' }}>₹{mrp}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', margin: '2px 0 0' }}>{discount}% off · save ₹{mrp - price}</p>
                </>
              )}
              {product.unit && !hasVariants && <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>per {product.unit}</p>}
            </div>
          </div>

          {product.category && (
            <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 12, textTransform: 'capitalize' }}>
              {product.category}
            </span>
          )}

          {product.description && (
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '12px 0 0' }}>{product.description}</p>
          )}

          {/* Variants */}
          {hasVariants && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Select Size</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.variants.map(v => {
                  const vMrp = Number(v.marketPrice || 0);
                  const vPrice = Number(v.price || 0);
                  const vDisc = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
                  return (
                    <button key={v.label} onClick={() => setSelectedVariant(v)}
                      style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid', borderColor: selectedVariant?.label === v.label ? '#16a34a' : '#e5e5e5', background: selectedVariant?.label === v.label ? '#f0fdf4' : 'white', color: selectedVariant?.label === v.label ? '#16a34a' : '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div>{v.label} — ₹{v.price}</div>
                      {vMrp > vPrice && <div style={{ fontSize: 10, color: '#ea580c', fontWeight: 700 }}>{vDisc}% off (MRP ₹{vMrp})</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div style={{ marginTop: 20 }}>
            {qty === 0 ? (
              <button onClick={handleAdd}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                <Plus size={16} /> Add to Cart
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#16a34a', borderRadius: 12, overflow: 'hidden', flex: 1 }}>
                  <button onClick={() => updateQty(cartKey, qty - 1)}
                    style={{ flex: 1, height: 48, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span style={{ color: 'white', fontSize: 18, fontWeight: 900, minWidth: 40, textAlign: 'center' }}>{qty}</span>
                  <button onClick={handleAdd}
                    style={{ flex: 1, height: 48, background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <Link to="/cart"
                  style={{ flexShrink: 0, background: '#0a0a0a', color: 'white', borderRadius: 12, padding: '14px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                  View Cart →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Perks */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 24 }}>
          {[
            { icon: Truck,       color: '#0284c7', label: 'Free delivery above ₹199' },
            { icon: ShieldCheck, color: '#16a34a', label: 'Freshness guaranteed or refund' },
            { icon: Star,        color: '#d97706', label: 'Handpicked quality checked' },
          ].map(({ icon: Icon, color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Icon size={16} color={color} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#555', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 14 }}>You may also like</p>
            <div className="product-grid">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
