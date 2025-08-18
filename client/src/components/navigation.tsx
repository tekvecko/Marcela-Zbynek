import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { User as UserType } from "@shared/schema";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const typedUser = user as UserType;

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-blush">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="font-script text-2xl text-romantic font-bold hover:text-love transition-colors">
            Marcela <span className="heart-decoration text-3xl">❤️</span> Zbyněk
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors ${location === '/' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Domů
            </Link>
            <Link 
              href="/photo-quest" 
              className={`transition-colors ${location === '/photo-quest' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Photo Quest
            </Link>
            <Link 
              href="/gallery" 
              className={`transition-colors ${location === '/gallery' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Galerie
            </Link>
            <Link 
              href="/details" 
              className={`transition-colors ${location === '/details' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Detaily
            </Link>
            <Link 
              href="/admin" 
              className={`transition-colors ${location === '/admin' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
            >
              Admin
            </Link>
            
            {isAuthenticated && typedUser && (
              <div className="flex items-center space-x-4 border-l border-blush pl-4">
                <div className="flex items-center space-x-2">
                  {typedUser.profileImageUrl ? (
                    <img 
                      src={typedUser.profileImageUrl} 
                      alt={typedUser.firstName || 'User'} 
                      className="w-8 h-8 rounded-full object-cover slow-pulse"
                      data-testid="img-avatar"
                    />
                  ) : (
                    <User size={20} className="text-charcoal" />
                  )}
                  <span className="text-charcoal text-sm" data-testid="text-username">
                    {typedUser.firstName || typedUser.email || 'Guest'}
                  </span>
                </div>
                <Button
                  onClick={() => window.location.href = '/api/logout'}
                  variant="ghost"
                  size="sm"
                  className="text-charcoal hover:text-romantic"
                  data-testid="button-logout"
                >
                  <LogOut size={16} />
                  Odhlásit
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-charcoal"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blush">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Domů
              </Link>
              <Link 
                href="/photo-quest"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/photo-quest' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Photo Quest
              </Link>
              <Link 
                href="/gallery"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/gallery' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Galerie
              </Link>
              <Link 
                href="/details"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/details' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Detaily
              </Link>
              <Link 
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`text-left transition-colors ${location === '/admin' ? 'text-romantic font-semibold' : 'text-charcoal hover:text-romantic'}`}
              >
                Admin
              </Link>
              
              {isAuthenticated && typedUser && (
                <div className="pt-4 border-t border-blush">
                  <div className="flex items-center space-x-2 mb-3">
                    {typedUser.profileImageUrl ? (
                      <img 
                        src={typedUser.profileImageUrl} 
                        alt={typedUser.firstName || 'User'} 
                        className="w-6 h-6 rounded-full object-cover slow-pulse"
                        data-testid="img-avatar-mobile"
                      />
                    ) : (
                      <User size={16} className="text-charcoal" />
                    )}
                    <span className="text-charcoal text-sm" data-testid="text-username-mobile">
                      {typedUser.firstName || typedUser.email || 'Guest'}
                    </span>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/api/logout'}
                    variant="ghost"
                    size="sm"
                    className="text-charcoal hover:text-romantic w-full justify-start"
                    data-testid="button-logout-mobile"
                  >
                    <LogOut size={16} />
                    Odhlásit se
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
