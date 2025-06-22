import { Switch, Route, useLocation } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import { ProtectedRoute } from "./lib/protected-route";
import DiagnosisHistoryPage from "@/pages/diagnosis-history";
import SubscriptionPage from "@/pages/subscription";
import CheckoutPage from "@/pages/checkout";
import SubscribeCheckoutPage from "@/pages/subscribe-checkout";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import SimpleOnboarding from "@/components/SimpleOnboarding";
import OfflineNotification from "@/components/OfflineNotification";
import { useEffect } from "react";
import { initOfflineStorage } from "@/lib/offlineStorage";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      {/* If user is logged in, show home page, otherwise show landing page */}
      <Route path="/" component={user ? HomePage : LandingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/history" component={DiagnosisHistoryPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/subscribe" component={SubscribeCheckoutPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
      <ProtectedRoute path="/analytics-dashboard" component={AnalyticsDashboardPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAuthPage = location === "/auth" || location.startsWith("/auth?");
  const isLandingPage = location === "/" && !user;

  // Initialize offline storage when the app loads
  useEffect(() => {
    initOfflineStorage().catch(error => {
      console.error("Failed to initialize offline storage:", error);
    });
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen app-container">
        <div className="flex-grow">
          <Router />
        </div>
        
        {/* Show onboarding for logged in users */}
        {user && <SimpleOnboarding />}
        
        {/* Show offline notification everywhere except landing page if not logged in */}
        {!(isLandingPage && !user) && <OfflineNotification />}
        
        {/* Toast notifications */}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
