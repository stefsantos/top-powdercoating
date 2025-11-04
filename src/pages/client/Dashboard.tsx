import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Package, Plus, FileText, TrendingUp } from 'lucide-react';

export default function ClientDashboard() {
  const navigate = useNavigate();

  const recentOrders = [
    {
      id: '1',
      orderId: 'ORD-2025-001',
      description: 'Aluminum Window Frames',
      status: 'coating' as const,
      progress: 65,
      estimatedCompletion: '2025-01-25',
      submittedDate: '2025-01-20',
      items: 12,
    },
    {
      id: '2',
      orderId: 'ORD-2025-002',
      description: 'Steel Railings',
      status: 'sand-blasting' as const,
      progress: 35,
      estimatedCompletion: '2025-01-28',
      submittedDate: '2025-01-22',
      items: 8,
    },
    {
      id: '3',
      orderId: 'ORD-2024-156',
      description: 'Industrial Machine Parts',
      status: 'completed' as const,
      progress: 100,
      estimatedCompletion: '2025-01-15',
      submittedDate: '2025-01-10',
      items: 25,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-muted text-muted-foreground';
      case 'in-progress':
      case 'sand-blasting':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'coating':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'curing':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'quality-check':
        return 'bg-primary-light/10 text-primary-light border-primary-light/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const stats = [
    { label: 'Active Orders', value: '2', icon: Package, color: 'text-primary' },
    { label: 'Completed', value: '18', icon: FileText, color: 'text-success' },
    { label: 'Avg. Turnaround', value: '5 days', icon: Clock, color: 'text-accent' },
  ];

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
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/client/order/${order.orderId}`)}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{order.description}</h3>
                          <p className="text-sm text-muted-foreground">{order.orderId}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted: {order.submittedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Est: {order.estimatedCompletion}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="w-4 h-4" />
                          <span>{order.items} items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
