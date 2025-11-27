import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClientDashboard from "./pages/client/Dashboard";
import Orders from "./pages/client/Orders";
import CreateOrder from "./pages/client/CreateOrder";
import OrderStatus from "./pages/client/OrderStatus";
import OrderDetail from "./pages/client/OrderDetail";
import OrderHistory from "./pages/client/OrderHistory";
import AdminDashboard from "./pages/admin/Dashboard";
import OrderManagement from "./pages/admin/OrderManagement";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import ClientManagement from "./pages/admin/ClientManagement";
import TeamManagement from "./pages/admin/TeamManagement";
import TeamDashboard from "./pages/team/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/');
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Client routes - Protected */}
      <Route 
        path="/client/dashboard" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <ClientDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/client/orders" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <Orders />
          </AuthGuard>
        } 
      />
      <Route 
        path="/client/create-order" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <CreateOrder />
          </AuthGuard>
        } 
      />
      <Route 
        path="/client/order-status" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderStatus />
          </AuthGuard>
        } 
      />
      <Route 
        path="/client/orders/history" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderHistory />
          </AuthGuard>
        } 
      />
      <Route 
        path="/client/orders/:id" 
        element={
          <AuthGuard>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderDetail />
          </AuthGuard>
        } 
      />
      
      {/* Admin routes - Protected with admin role check */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AuthGuard requireAdmin>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <AuthGuard requireAdmin>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <OrderManagement />
          </AuthGuard>
        } 
      />
      <Route 
        path="/admin/orders/:id" 
        element={
          <AuthGuard requireAdmin>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <AdminOrderDetail />
          </AuthGuard>
        } 
      />
      <Route
        path="/admin/clients" 
        element={
          <AuthGuard requireAdmin>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <ClientManagement />
          </AuthGuard>
        } 
      />
      <Route
        path="/admin/team" 
        element={
          <AuthGuard requireAdmin>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <TeamManagement />
          </AuthGuard>
        } 
      />
      
      {/* Team Member Routes */}
      <Route 
        path="/team/dashboard" 
        element={
          <AuthGuard requireTeamMember>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <TeamDashboard />
          </AuthGuard>
        } 
      />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
