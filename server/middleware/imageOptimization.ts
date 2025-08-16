import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Middleware for image optimization (simplified version)
export function imageOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process image requests
  if (!req.path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return next();
  }

  // Add cache headers for images
  res.set({
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Vary': 'Accept-Encoding',
  });

  // Check if client accepts WebP
  const acceptsWebP = req.headers.accept?.includes('image/webp');
  
  if (acceptsWebP) {
    res.set('Content-Type', 'image/webp');
  }

  next();
}

// Helper function to validate image dimensions
export function validateImageDimensions(width?: string, height?: string) {
  const maxWidth = 2048;
  const maxHeight = 2048;
  
  const w = width ? Math.min(parseInt(width), maxWidth) : undefined;
  const h = height ? Math.min(parseInt(height), maxHeight) : undefined;
  
  return { width: w, height: h };
}