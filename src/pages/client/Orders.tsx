import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, Zap, Eye, CheckCircle, Loader2, Droplets, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  description: string;
  status: string;
  estimated_completion: string | null;
  submitted_date: string;
}

const statusSteps = [
  { key: 'received', label: 'Received', icon: Clock },
  { key: 'in_preparation', label: 'Preparation', icon: Zap },
  { key: 'coating_in_progress', label: 'Coating', icon: Droplets },
  { key: 'quality_check', label: 'Quality Check', icon: Shield },
  { key: 'ready_for_pickup', label: 'Ready', icon: CheckCircle }
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState('in-progress');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
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

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const calculateProgress = (status: string) => {
    const index = getStatusIndex(status);
    return ((index + 1) / statusSteps.length) * 100;
  };

  const inProgressOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track your powder coating orders</p>
          </div>
          <Link to="/client/create-order">
            <Button size="lg" className="gap-2">
              <Package className="h-5 w-5" />
              Create New Order
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="in-progress">In Progress ({inProgressOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-6">
            {inProgressOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders in progress</p>
                  <Link to="/client/create-order">
                    <Button className="mt-4">Create Your First Order</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              inProgressOrders.map(order => (
                <Card key={order.id}>
                  <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">{order.description}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {statusSteps[getStatusIndex(order.status)]?.label || order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{calculateProgress(order.status).toFixed(0)}%</span>
                        </div>
                        <Progress value={calculateProgress(order.status)} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                          <p className="font-medium">{new Date(order.submitted_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Est. Completion</p>
                          <p className="font-medium">{order.estimated_completion ? new Date(order.estimated_completion).toLocaleDateString() : 'TBD'}</p>
                        </div>
                      </div>
                      <Link to={`/client/orders/${order.id}`}>
                        <Button variant="outline" className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed">
            <Link to="/client/orders/history">
              <Button variant="outline" className="mb-6">View Full Order History</Button>
            </Link>
            {completedOrders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed orders yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}