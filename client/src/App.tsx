import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/auth-context';
import { Toaster } from './components/ui/toaster';
import Navigation from './components/navigation';
import HomePage from './pages/home';
import PhotoQuestPage from './pages/photo-quest';
import GalleryPage from './pages/gallery';
import ChallengePage from './pages/challenge';
import DetailsPage from './pages/details';
import AdminPage from './pages/admin';
import LoginPage from './pages/login';
import ProfilePage from './pages/profile';
import MiniGamesPage from './pages/mini-games';
import MiniGamePlayPage from './pages/mini-game-play';
import LeaderboardsPage from './pages/leaderboards';
import NotFoundPage from './pages/not-found';
import VerificationDemoPage from './pages/verification-demo';
import ErrorBoundary from './components/ui/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/photo-quest" component={PhotoQuestPage} />
                <Route path="/gallery" component={GalleryPage} />
                <Route path="/challenge/:id" component={ChallengePage} />
                <Route path="/details" component={DetailsPage} />
                <Route path="/admin" component={AdminPage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/mini-games" component={MiniGamesPage} />
                <Route path="/mini-game/:gameId" component={MiniGamePlayPage} />
                <Route path="/leaderboards" component={LeaderboardsPage} />
                <Route path="/verification-demo" component={VerificationDemoPage} />
                <Route component={NotFoundPage} />
              </Switch>
            </main>
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;