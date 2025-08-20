import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}