import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
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
      
      {/* Client routes */}
      <Route 
        path="/client/dashboard" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <ClientDashboard />
          </>
        } 
      />
      <Route 
        path="/client/orders" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <Orders />
          </>
        } 
      />
      <Route 
        path="/client/create-order" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <CreateOrder />
          </>
        } 
      />
      <Route 
        path="/client/order-status" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderStatus />
          </>
        } 
      />
      <Route 
        path="/client/orders/history" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderHistory />
          </>
        } 
      />
      <Route 
        path="/client/orders/:id" 
        element={
          <>
            <Navigation isAdmin={false} onLogout={handleLogout} />
            <OrderDetail />
          </>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <AdminDashboard />
          </>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <OrderManagement />
          </>
        } 
      />
      <Route 
        path="/admin/orders/:id" 
        element={
          <>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <AdminOrderDetail />
          </>
        } 
      />
      <Route
        path="/admin/clients" 
        element={
          <>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <ClientManagement />
          </>
        } 
      />
      <Route
        path="/admin/team" 
        element={
          <>
            <Navigation isAdmin={true} onLogout={handleLogout} />
            <TeamManagement />
          </>
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
