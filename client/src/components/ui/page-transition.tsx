import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPath, setCurrentPath] = useState(location);

  useEffect(() => {
    if (location !== currentPath) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentPath(location);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, currentPath]);

  return (
    <div className={`transition-all duration-300 ease-in-out ${
      isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
    }`}>
      {children}
    </div>
  );
}