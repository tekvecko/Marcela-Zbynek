import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserWithProgress } from '../../../shared/schema';

export default function Header() {
  const location = useLocation();
  
  const { data: user } = useQuery<UserWithProgress>({
    queryKey: ['/api/users/me'],
  });

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', current: location.pathname === '/dashboard' },
    { path: '/challenges', label: 'Challenges', current: location.pathname === '/challenges' },
    { path: '/leaderboard', label: 'Leaderboard', current: location.pathname === '/leaderboard' },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50" data-testid="header">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-2xl font-bold gradient-text" data-testid="logo">
              PhotoQuest
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition-colors ${
                    item.current 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-2 bg-secondary/30 rounded-lg px-3 py-2" data-testid="user-points">
                <span className="text-accent">🏆</span>
                <span className="font-semibold">{user.points.toLocaleString()}</span>
                <span className="text-muted-foreground">pts</span>
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="relative" data-testid="notifications">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>
            
            <Button variant="ghost" size="icon" data-testid="user-menu">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
