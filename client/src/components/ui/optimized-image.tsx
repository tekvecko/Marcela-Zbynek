import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import LoadingSpinner from "./loading-spinner";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  blur?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className, 
  fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f3f4f6'%3E%3Crect width='100%25' height='100%25'/%3E%3C/svg%3E",
  blur = true
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div ref={imgRef} className="relative overflow-hidden w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="md" className="text-gray-400" />
        </div>
      )}
      
      {isVisible && (
        <img
          src={hasError ? fallback : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-all duration-300",
            // Použij object-cover jako výchozí, ale umožni override přes className
            className?.includes('object-') ? '' : 'object-cover',
            isLoading ? "opacity-0" : "opacity-100",
            blur && isLoading ? "blur-sm" : "blur-0",
            className
          )}
          loading="lazy"
        />
      )}
    </div>
  );
}