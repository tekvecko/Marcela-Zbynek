import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "@/components/ui/page-transition";
import Home from "@/pages/home";
import PhotoQuestPage from "@/pages/photo-quest";
import GalleryPage from "@/pages/gallery";
import DetailsPage from "@/pages/details";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/photo-quest" component={PhotoQuestPage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/details" component={DetailsPage} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
