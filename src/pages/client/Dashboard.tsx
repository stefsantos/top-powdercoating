import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Package, Plus, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  description: string;
  status: string;
  estimated_completion: string | null;
  submitted_date: string;
  quantity: number;
}

const statusSteps = [
  { key: 'received', label: 'Received' },
  { key: 'in_preparation', label: 'Preparation' },
  { key: 'coating_in_progress', label: 'Coating' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'completed', label: 'Completed' }
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('dashboard-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'received': 'bg-muted text-muted-foreground',
      'in_preparation': 'bg-accent text-accent-foreground',
      'coating_in_progress': 'bg-primary text-primary-foreground',
      'quality_check': 'bg-secondary text-secondary-foreground',
      'ready_for_pickup': 'bg-primary text-primary-foreground',
      'completed': 'bg-primary text-primary-foreground'
    };
    return colors[status] || 'bg-muted';
  };

  const formatStatus = (status: string) => {
    const step = statusSteps.find(s => s.key === status);
    return step ? step.label : status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const calculateProgress = (status: string) => {
    const index = statusSteps.findIndex(step => step.key === status);
    return ((index + 1) / statusSteps.length) * 100;
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const avgTurnaround = completedOrders.length > 0
    ? Math.round(completedOrders.reduce((acc, order) => {
        const start = new Date(order.submitted_date);
        const end = order.estimated_completion ? new Date(order.estimated_completion) : new Date();
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / completedOrders.length)
    : 0;

  const stats = [
    { label: 'Active Orders', value: activeOrders.length.toString(), icon: Package, color: 'text-primary' },
    { label: 'Completed', value: completedOrders.length.toString(), icon: FileText, color: 'text-success' },
    { label: 'Avg. Turnaround', value: avgTurnaround > 0 ? `${avgTurnaround} days` : 'N/A', icon: Clock, color: 'text-accent' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track and manage your powder coating orders</p>
          </div>
          <Button variant="hero" onClick={() => navigate('/client/create-order')}>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/client/orders')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button onClick={() => navigate('/client/create-order')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Order
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/client/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{calculateProgress(order.status).toFixed(0)}%</span>
                      </div>
                      <Progress value={calculateProgress(order.status)} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {order.estimated_completion ? new Date(order.estimated_completion).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <span>{order.quantity} items</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/client/create-order')}>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Create Order</h3>
              <p className="text-sm text-muted-foreground">Start a new powder coating order</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/client/orders')}>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track Orders</h3>
              <p className="text-sm text-muted-foreground">View order status and history</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">View Reports</h3>
              <p className="text-sm text-muted-foreground">Access invoices and reports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
