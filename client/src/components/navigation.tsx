import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-blush">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="font-script text-2xl text-romantic font-bold">
            Marcela <span className="heart-decoration text-3xl">❤️</span> Zbyněk
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('countdown')} 
              className="text-charcoal hover:text-romantic transition-colors"
            >
              Odpočet
            </button>
            <button 
              onClick={() => scrollToSection('photo-quest')} 
              className="text-charcoal hover:text-romantic transition-colors"
            >
              Photo Quest
            </button>
            <button 
              onClick={() => scrollToSection('gallery')} 
              className="text-charcoal hover:text-romantic transition-colors"
            >
              Galerie
            </button>
            <button 
              onClick={() => scrollToSection('details')} 
              className="text-charcoal hover:text-romantic transition-colors"
            >
              Detaily
            </button>
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
              <button 
                onClick={() => scrollToSection('countdown')} 
                className="text-left text-charcoal hover:text-romantic transition-colors"
              >
                Odpočet
              </button>
              <button 
                onClick={() => scrollToSection('photo-quest')} 
                className="text-left text-charcoal hover:text-romantic transition-colors"
              >
                Photo Quest
              </button>
              <button 
                onClick={() => scrollToSection('gallery')} 
                className="text-left text-charcoal hover:text-romantic transition-colors"
              >
                Galerie
              </button>
              <button 
                onClick={() => scrollToSection('details')} 
                className="text-left text-charcoal hover:text-romantic transition-colors"
              >
                Detaily
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
