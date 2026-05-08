import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  ParentAuthProvider,
  useParentAuth,
} from "@/contexts/ParentAuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ParentLogin from "./pages/ParentLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Lazy load heavy page components
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const BabyDetail = React.lazy(() => import("./pages/BabyDetail"));
const RegisterBaby = React.lazy(() => import("./pages/RegisterBaby"));
const Alerts = React.lazy(() => import("./pages/Alerts"));
const AlertHistory = React.lazy(() => import("./pages/AlertHistory"));
const ParentPortal = React.lazy(() => import("./pages/ParentPortal"));
const LiveMonitoring = React.lazy(() => import("./pages/LiveMonitoring"));
const NICUEnvironment = React.lazy(() => import("./pages/NICUEnvironment"));
const ShiftHandover = React.lazy(() => import("./pages/ShiftHandover"));
const FeedingStatusPage = React.lazy(() => import("./pages/FeedingStatus"));
const HealthRecords = React.lazy(() => import("./pages/HealthRecords"));
const CryDetectionPage = React.lazy(() => import("./pages/CryDetectionPage"));
const VoiceAssistant = React.lazy(() => import("./pages/VoiceAssistant"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const ParentProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useParentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/parent/login" replace />;
  }

  return <>{children}</>;
};

const ParentPublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useParentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/parent/portal" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/baby/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <BabyDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RegisterBaby />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Alerts />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <AlertHistory />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/* Parent Portal Routes - No authentication required */}
      <Route
        path="/parent"
        element={<Navigate to="/parent/portal" replace />}
      />
      <Route
        path="/parent/login"
        element={<Navigate to="/parent/portal" replace />}
      />
      <Route
        path="/parent/portal"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ParentPortal />
          </Suspense>
        }
      />
      <Route
        path="/live-monitoring"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LiveMonitoring />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/* New System-Level Pages */}
      <Route
        path="/cry-detection"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <CryDetectionPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nicu-environment"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <NICUEnvironment />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shift-handover"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ShiftHandover />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeding-status"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <FeedingStatusPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/health-records"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <HealthRecords />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice-assistant"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <VoiceAssistant />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ParentAuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </ParentAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
