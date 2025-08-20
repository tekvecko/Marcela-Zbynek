import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Middleware for image optimization 
export function imageOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process image requests
  if (!req.path.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
    return next();
  }

  // Add comprehensive cache headers for images
  res.set({
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Vary': 'Accept-Encoding, Accept',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`,
  });

  // Check if client accepts WebP and modern formats
  const acceptsWebP = req.headers.accept?.includes('image/webp');
  const acceptsAvif = req.headers.accept?.includes('image/avif');
  
  // Prefer AVIF, then WebP, then original
  if (acceptsAvif) {
    res.set('Content-Type', 'image/avif');
  } else if (acceptsWebP) {
    res.set('Content-Type', 'image/webp');
  }

  next();
}

// Enhanced image compression utility
export async function compressImage(filePath: string, quality: number = 80): Promise<string> {
  // This would integrate with sharp or similar library in production
  // For now, return original path
  return filePath;
}

// Helper function to validate image dimensions
export function validateImageDimensions(width?: string, height?: string) {
  const maxWidth = 2048;
  const maxHeight = 2048;
  
  const w = width ? Math.min(parseInt(width), maxWidth) : undefined;
  const h = height ? Math.min(parseInt(height), maxHeight) : undefined;
  
  return { width: w, height: h };
}