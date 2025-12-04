import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Passwords from "./pages/Passwords";
import Notes from "./pages/Notes";
import Todos from "./pages/Todos";
import Vault from "./pages/Vault";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/passwords"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Passwords />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Notes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Todos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vault />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Expenses />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/income"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Income />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
