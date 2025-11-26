import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Menu, X, Package, FileText, Clock, Users, BarChart } from 'lucide-react';
import { NotificationsPopover } from './NotificationsPopover';
import logo from '@/assets/logo.jpg';

interface NavigationProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export function Navigation({ isAdmin = false, onLogout }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const clientNav = [
    { label: 'Dashboard', path: '/client/dashboard', icon: Package },
    { label: 'Create Order', path: '/client/create-order', icon: FileText },
    { label: 'Order Status', path: '/client/order-status', icon: Clock },
    { label: 'My Orders', path: '/client/orders', icon: FileText },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart },
    { label: 'Orders', path: '/admin/orders', icon: Package },
    { label: 'Clients', path: '/admin/clients', icon: Users },
    { label: 'Team', path: '/admin/team', icon: Users },
  ];

  const navItems = isAdmin ? adminNav : clientNav;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/client/dashboard')}>
            <img src={logo} alt="Top Powdercoating Logo" className="h-10 w-10 object-contain rounded-lg" />
            <span className="text-xl font-bold text-foreground hidden md:block">
              Top Powdercoating
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={isActive ? 'bg-primary/10 text-primary' : ''}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
              <NotificationsPopover
                isOpen={notificationsOpen}
                onClose={() => {
                  setNotificationsOpen(false);
                  fetchUnreadCount();
                }}
                isAdmin={isAdmin}
              />
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex"
            >
              <LogOut className="w-5 h-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`justify-start ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
              <Button variant="ghost" onClick={handleLogout} className="justify-start text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
