import React from 'react';
import { Image } from 'expo-image';

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function CachedImage({ uri, style, resizeMode = 'cover', fallback }) {
  if (!uri) return fallback || null;

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={resizeMode}
      placeholder={blurhash}
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}
