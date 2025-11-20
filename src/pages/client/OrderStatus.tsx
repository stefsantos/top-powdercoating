import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Package, Zap, Shield, CheckCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  description: string;
  project_name: string;
  status: string;
  estimated_completion: string | null;
  submitted_date: string;
  progress: number;
}

const statusSteps = [
  { key: 'queued', label: 'Queued', icon: Clock, color: 'bg-blue-500', description: 'Order submitted and queued for processing' },
  { key: 'sand-blasting', label: 'In Process', icon: Package, color: 'bg-orange-500', description: 'Surface preparation and coating application' },
  { key: 'curing', label: 'Curing', icon: Zap, color: 'bg-purple-500', description: 'Heat curing for durability and finish quality' },
  { key: 'quality-check', label: 'Quality Check', icon: Shield, color: 'bg-indigo-500', description: 'Final inspection and quality assurance' },
  { key: 'completed', label: 'Ready for Pickup', icon: CheckCircle, color: 'bg-green-500', description: 'Order complete and ready for collection' }
];

export default function OrderStatus() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('order-status-changes')
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
        .neq('status', 'completed')
        .order('submitted_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    return orders.filter(o => {
      if (status === 'sand-blasting') {
        return o.status === 'sand-blasting' || o.status === 'coating';
      }
      return o.status === status;
    }).length;
  };

  const calculateProgress = (status: string) => {
    const index = statusSteps.findIndex(step => step.key === status);
    return index >= 0 ? ((index + 1) / statusSteps.length) * 100 : 0;
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const isStatusActive = (stepIndex: number, currentStatus: string) => {
    const currentIndex = getStatusIndex(currentStatus);
    return stepIndex <= currentIndex;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'quality-check': return 'bg-indigo-500 text-white';
      case 'curing': return 'bg-purple-500 text-white';
      case 'coating':
      case 'sand-blasting': return 'bg-orange-500 text-white';
      case 'queued': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'sand-blasting' || status === 'coating') return 'In Process';
    if (status === 'completed') return 'Ready for Pickup';
    const step = statusSteps.find(s => s.key === status);
    return step ? step.label : status;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Order Status Tracker</h1>
              <p className="text-muted-foreground">Track your powder coating orders through each stage of our process</p>
            </div>
          </div>

          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const count = getStatusCount(step.key);
              
              return (
                <Card key={step.key} className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`h-12 w-12 rounded-full ${step.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {count}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{step.label}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Orders */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Active Orders</h2>
            
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading orders...</p>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active orders</h3>
                  <p className="text-muted-foreground mb-4">You don't have any orders in progress</p>
                  <Button onClick={() => navigate('/client/create-order')}>
                    Create New Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const progress = order.progress || calculateProgress(order.status);
                const currentStatusIndex = getStatusIndex(order.status);
                const isReadyForPickup = order.status === 'completed';

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Order Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-1">{order.order_number}</h3>
                            <p className="text-muted-foreground">
                              {order.project_name || order.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/client/orders/${order.id}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Summary
                            </Button>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>Submitted: {new Date(order.submitted_date).toLocaleDateString()}</span>
                          {order.estimated_completion && (
                            <span>Est. Completion: {new Date(order.estimated_completion).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-semibold">Progress</span>
                            <span className="font-bold">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                        </div>

                        {/* Status Timeline */}
                        <div className="flex items-center justify-between px-4">
                          {statusSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = isStatusActive(index, order.status);
                            const isCurrent = index === currentStatusIndex;

                            return (
                              <div key={step.key} className="flex flex-col items-center">
                                <div
                                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                                    isActive
                                      ? step.color
                                      : 'bg-muted'
                                  } ${isCurrent ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                >
                                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                                </div>
                                <span className={`mt-2 text-xs font-medium text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Ready for Pickup Alert */}
                        {isReadyForPickup && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-green-900 mb-1">Ready for Pickup!</h4>
                              <p className="text-sm text-green-700">Visit us during operating hours: 8 AM – 5 PM</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
