import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/photo-quest" element={<PhotoQuestPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/challenge/:id" element={<ChallengePage />} />
                  <Route path="/details" element={<DetailsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/mini-games" element={<MiniGamesPage />} />
                  <Route path="/mini-game/:gameId" element={<MiniGamePlayPage />} />
                  <Route path="/leaderboards" element={<LeaderboardsPage />} />
                  <Route path="/verification-demo" element={<VerificationDemoPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;