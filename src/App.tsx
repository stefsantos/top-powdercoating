import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClientDashboard from "./pages/client/Dashboard";
import Orders from "./pages/client/Orders";
import CreateOrder from "./pages/client/CreateOrder";
import OrderDetail from "./pages/client/OrderDetail";
import OrderHistory from "./pages/client/OrderHistory";
import AdminDashboard from "./pages/admin/Dashboard";
import OrderManagement from "./pages/admin/OrderManagement";
import ClientManagement from "./pages/admin/ClientManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const handleLogout = () => {
    // Handle logout logic here
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
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
              path="/client/orders/new" 
              element={
                <>
                  <Navigation isAdmin={false} onLogout={handleLogout} />
                  <CreateOrder />
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
              path="/admin/clients" 
              element={
                <>
                  <Navigation isAdmin={true} onLogout={handleLogout} />
                  <ClientManagement />
                </>
              } 
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
