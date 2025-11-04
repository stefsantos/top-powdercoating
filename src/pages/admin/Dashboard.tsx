import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Total Orders', value: '142', change: '+12%', icon: Package, color: 'primary' },
    { label: 'Active Orders', value: '28', change: '+5%', icon: Clock, color: 'warning' },
    { label: 'Completed Today', value: '8', change: '+3', icon: CheckCircle, color: 'success' },
    { label: 'Total Clients', value: '67', change: '+8%', icon: Users, color: 'accent' },
  ];

  const urgentOrders = [
    {
      id: '1',
      orderId: 'ORD-2025-015',
      clientName: 'ABC Manufacturing',
      description: 'Urgent steel parts coating',
      status: 'sand-blasting',
      priority: 'high',
      progress: 45,
      deadline: '2025-01-23',
    },
    {
      id: '2',
      orderId: 'ORD-2025-018',
      clientName: 'XYZ Industries',
      description: 'Aluminum frames project',
      status: 'quality-check',
      priority: 'high',
      progress: 85,
      deadline: '2025-01-24',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      queued: 'bg-muted text-muted-foreground',
      'sand-blasting': 'bg-warning/10 text-warning border-warning/20',
      coating: 'bg-primary/10 text-primary border-primary/20',
      curing: 'bg-accent/10 text-accent border-accent/20',
      'quality-check': 'bg-primary-light/10 text-primary-light border-primary-light/20',
      completed: 'bg-success/10 text-success border-success/20',
      delayed: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] || colors.queued;
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : priority === 'medium'
      ? 'bg-warning/10 text-warning border-warning/20'
      : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all operations and metrics</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <metric.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {metric.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Urgent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Urgent Orders
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{order.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.orderId} • {order.clientName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {order.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/orders')}>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Manage Orders</h3>
              <p className="text-sm text-muted-foreground">View and update orders</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/clients')}>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Client Management</h3>
              <p className="text-sm text-muted-foreground">Manage client accounts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Financial Reports</h3>
              <p className="text-sm text-muted-foreground">View revenue and analytics</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">System Alerts</h3>
              <p className="text-sm text-muted-foreground">View notifications</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
