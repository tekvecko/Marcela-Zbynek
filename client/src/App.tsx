import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { OnboardingProvider } from "@/components/onboarding/onboarding-context";
import PageTransition from "@/components/ui/page-transition";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import PhotoQuestPage from "@/pages/photo-quest";
import ChallengePage from "@/pages/challenge";
import GalleryPage from "@/pages/gallery";
import DetailsPage from "@/pages/details";
import AdminPage from "@/pages/admin";
import VerificationDemoPage from "@/pages/verification-demo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={LoginPage} />
        <Route path="/photo-quest" component={PhotoQuestPage} />
        <Route path="/challenge/:id" component={ChallengePage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/details" component={DetailsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/verification-demo" component={VerificationDemoPage} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
