import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminDashboardProps {
  onViewChange: (view: string) => void;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  submitted_date: string;
  estimated_completion: string | null;
  description: string;
  project_name: string;
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('submitted_date', { ascending: false })
        .limit(4);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const ongoingOrders = orders.filter(o => ['in_preparation', 'coating_in_progress', 'quality_check'].includes(o.status)).length;
  const delayedOrders = 0; // TODO: Calculate based on estimated_completion

  const kpis = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      change: '+12%',
      trend: 'up',
      icon: Package,
      description: 'This month',
    },
    {
      title: 'Ongoing Projects',
      value: ongoingOrders.toString(),
      change: '+5',
      trend: 'up',
      icon: Clock,
      description: 'Currently active',
    },
    {
      title: 'Delayed Projects',
      value: delayedOrders.toString(),
      change: '-2',
      trend: 'down',
      icon: AlertTriangle,
      description: 'Needs attention',
    },
    {
      title: 'Revenue (MTD)',
      value: '₱2.4M',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      description: 'Month to date',
    },
  ];

  const productionStats = [
    { stage: 'Queued', count: orders.filter(o => o.status === 'received').length, color: 'bg-blue-500' },
    { stage: 'In Preparation', count: orders.filter(o => o.status === 'in_preparation').length, color: 'bg-orange-500' },
    { stage: 'Coating', count: orders.filter(o => o.status === 'coating_in_progress').length, color: 'bg-[#fb7616]' },
    { stage: 'Quality Check', count: orders.filter(o => o.status === 'quality_check').length, color: 'bg-indigo-500' },
    { stage: 'Completed', count: orders.filter(o => o.status === 'completed').length, color: 'bg-green-500' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'received': 'bg-blue-100 text-blue-800',
      'in_preparation': 'bg-orange-100 text-orange-800',
      'coating_in_progress': 'bg-[#fb7616] text-white',
      'quality_check': 'bg-indigo-100 text-indigo-800',
      'ready_for_pickup': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'urgent': 'bg-red-100 text-red-800',
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <ScrollArea className="h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Monitor operations and manage powder coating projects</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={`mr-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change}
                  </span>
                  {kpi.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewChange('order-management')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">{order.project_name}</p>
                        <p className="text-sm text-muted-foreground">{order.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Submitted</span>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{new Date(order.submitted_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Overview & Quick Stats */}
        <div className="space-y-6">
          {/* Production Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Production Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                      <span className="text-sm font-medium">{stat.stage}</span>
                    </div>
                    <Badge variant="secondary">{stat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onViewChange('order-management')}
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Orders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onViewChange('client-management')}
              >
                <Users className="w-4 h-4 mr-2" />
                Client Management
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Production Line</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality Control</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Equipment Status</span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Maintenance Due</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ScrollArea>
  );
}
