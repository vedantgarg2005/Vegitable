import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['all', 'vegetables', 'fruits', 'leafy', 'exotic', 'herbs', 'organic'];
const SORTS = [
  { value: 'default',    label: 'Relevance' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name',       label: 'A → Z' },
];

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #f0f0f0', overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '1/1' }} />
      <div style={{ padding: 10 }}>
        <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 6, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 10, borderRadius: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 14, width: '30%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 30, width: 30, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery]       = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [category, setCategory] = useState('all');
  const [sort, setSort]         = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef();
  const debounceRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() && category === 'all') { setProducts([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (category !== 'all') params.set('category', category);
        const { data } = await api.get(`/admin/products?${params}`);
        let list = Array.isArray(data) ? data : data.products || [];
        list = list.filter(p => p.isActive !== false);
        if (sort === 'price_asc')  list = [...list].sort((a, b) => a.price - b.price);
        if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
        if (sort === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
      } catch { setProducts([]); }
      setLoading(false);
    }, 350);
  }, [query, category, sort]);

  const hasResults = !loading && products.length > 0;
  const noResults  = !loading && (query.trim() || category !== 'all') && products.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f6faf7' }}>
      {/* Search bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #efefef', padding: '12px 16px', position: 'sticky', top: 56, zIndex: 90 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#f5f5f5', borderRadius: 12, padding: '10px 14px', border: '1.5px solid transparent', transition: 'all 0.15s' }}
            onFocus={e => e.currentTarget.style.borderColor = '#16a34a'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}>
            <SearchIcon size={15} color="#aaa" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search vegetables, fruits, herbs…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, fontWeight: 500, color: '#0a0a0a', fontFamily: 'inherit' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: '#aaa' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12, border: '1.5px solid', borderColor: showFilters ? '#16a34a' : '#e5e5e5', background: showFilters ? '#f0fdf4' : 'white', color: showFilters ? '#16a34a' : '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* Filters row */}
        {showFilters && (
          <div style={{ maxWidth: 700, margin: '10px auto 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Categories */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', borderColor: category === c ? '#16a34a' : '#e5e5e5', background: category === c ? '#16a34a' : 'white', color: category === c ? 'white' : '#555', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 700, color: '#555', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Loading */}
        {loading && (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 14 }}>
              {products.length} result{products.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}
            </p>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </>
        )}

        {/* No results */}
        {noResults && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 6px' }}>No results found</p>
            <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px' }}>Try a different search or browse all products</p>
            <Link to="/" style={{ display: 'inline-block', background: '#16a34a', color: 'white', borderRadius: 10, padding: '10px 20px', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Browse All Products
            </Link>
          </div>
        )}

        {/* Idle state */}
        {!loading && !query && category === 'all' && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🥦</div>
            <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 6px', color: '#0a0a0a' }}>Search for fresh produce</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>Type a name or use filters above</p>
          </div>
        )}
      </div>
    </div>
  );
}
