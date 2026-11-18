import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // e.g. 'aspect-video' (16:9)
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = '/images/branded-residence.jpg',
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full relative overflow-hidden bg-[#14161A]',
  aspectRatio = 'aspect-video'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const effectiveSrc = error || !src ? fallbackSrc : src;

  return (
    <div className={`${containerClassName} ${aspectRatio}`}>
      {/* Loading Shimmer Skeleton */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#14161A] via-[#1E2229] to-[#14161A] animate-pulse flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[#2D323C] animate-pulse" />
        </div>
      )}

      {/* Rendered Image */}
      <img
        src={effectiveSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          if (!error && fallbackSrc && effectiveSrc !== fallbackSrc) {
            setError(true);
          } else {
            setLoading(false);
          }
        }}
        className={`${className} transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};
