import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { AppLayout } from "./components/layout/app-layout";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import LandingPage from "./pages/landing";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import FeedPage from "./pages/feed";
import ReportPage from "./pages/report";
import ItemDetailPage from "./pages/item-detail";
import ClaimVerifyPage from "./pages/claim-verify";
import ActivityPage from "./pages/activity";
import AdminDashboard from "./pages/admin";
import ChatPage from "./pages/chat";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, requireAdmin = false }: { component: any, requireAdmin?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Redirect to="/feed" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route path="/feed">
        {() => <ProtectedRoute component={FeedPage} />}
      </Route>
      <Route path="/report">
        {() => <ProtectedRoute component={ReportPage} />}
      </Route>
      <Route path="/item/:id">
        {() => <ProtectedRoute component={ItemDetailPage} />}
      </Route>
      <Route path="/claim/:id">
        {() => <ProtectedRoute component={ClaimVerifyPage} />}
      </Route>
      <Route path="/activity">
        {() => <ProtectedRoute component={ActivityPage} />}
      </Route>
      <Route path="/chat">
        {() => <ProtectedRoute component={ChatPage} />}
      </Route>
      
      {/* Admin Route */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} requireAdmin={true} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
