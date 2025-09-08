import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-primary">
            <i className="fas fa-gamepad mr-2"></i>
            Gaming Platform
          </h1>
          <div className="hidden md:flex space-x-4">
            <a href="/" className="text-foreground hover:text-primary transition-colors" data-testid="link-dashboard">
              Dashboard
            </a>
            <a href="/profile" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-profile">
              Profil
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-challenges">
              Výzvy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-minigames">
              Mini-hry
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-leaderboard">
              Žebříček
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors" data-testid="button-notifications">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 bg-destructive text-xs rounded-full px-1.5 py-0.5 pulse-notification" data-testid="text-notification-count">
              
            </span>
          </button>
          
          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center" data-testid="img-avatar">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-sm text-primary-foreground"></i>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              Odhlásit se
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
