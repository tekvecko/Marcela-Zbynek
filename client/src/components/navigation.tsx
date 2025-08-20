import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import GlassButton from "@/components/ui/glass-button";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

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

            {!user && (
              <Link href="/login">
                <GlassButton variant="outline" size="sm">
                  Přihlásit se
                </GlassButton>
              </Link>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/30 text-charcoal"
                  >
                    <User size={16} className="mr-2" />
                    {user.firstName || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm">
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Odhlásit se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

              {!user && (
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <GlassButton variant="outline" size="sm">
                    Přihlásit se
                  </GlassButton>
                </Link>
              )}

              {user && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center text-charcoal">
                    <User size={16} className="mr-2" />
                    {user.firstName || user.email}
                  </div>
                  <GlassButton variant="outline" size="sm" onClick={logout} className="text-red-600 w-full">
                    Odhlásit se
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}