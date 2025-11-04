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
import AdminDashboard from "./pages/admin/Dashboard";
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
              path="/client/*" 
              element={
                <>
                  <Navigation isAdmin={false} onLogout={handleLogout} />
                  <div className="min-h-screen bg-background pt-24 px-4">
                    <div className="max-w-7xl mx-auto text-center py-12">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
                      <p className="text-muted-foreground">This feature is under development</p>
                    </div>
                  </div>
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
              path="/admin/*" 
              element={
                <>
                  <Navigation isAdmin={true} onLogout={handleLogout} />
                  <div className="min-h-screen bg-background pt-24 px-4">
                    <div className="max-w-7xl mx-auto text-center py-12">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
                      <p className="text-muted-foreground">This feature is under development</p>
                    </div>
                  </div>
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
