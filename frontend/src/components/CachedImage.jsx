import { useState, useEffect, useRef } from 'react';

const CACHE_NAME = 'freshbasket-images-v1';
const memoryCache = new Map();

export default function CachedImage({ src, alt, style, onError, ...props }) {
  const [cachedSrc, setCachedSrc] = useState(() => memoryCache.get(src) || src);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!src || memoryCache.has(src)) return;

    const load = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(src);
        if (cached) {
          const blob = await cached.blob();
          const url = URL.createObjectURL(blob);
          memoryCache.set(src, url);
          if (mounted.current) setCachedSrc(url);
          return;
        }
        const res = await fetch(src);
        if (!res.ok) return;
        await cache.put(src, res.clone());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        memoryCache.set(src, url);
        if (mounted.current) setCachedSrc(url);
      } catch {
        // fallback to original src — already set as initial state
      }
    };

    load();
    return () => { mounted.current = false; };
  }, [src]);

  return (
    <img
      src={cachedSrc}
      alt={alt}
      style={style}
      onError={onError}
      {...props}
    />
  );
}
