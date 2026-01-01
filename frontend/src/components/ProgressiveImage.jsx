import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ProgressiveImage component with blur-up placeholder effect
 * Shows a skeleton placeholder while loading, then fades in the actual image
 */
export const ProgressiveImage = ({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '',
  onLoad,
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true); // Stop showing skeleton on error
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton placeholder - shown while loading */}
      {!imageLoaded && (
        <Skeleton 
          className={`absolute inset-0 ${skeletonClassName}`}
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      {!imageError && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Native lazy loading
          {...props}
        />
      )}
      
      {/* Error fallback */}
      {imageError && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <span className="text-gray-400 text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
};

