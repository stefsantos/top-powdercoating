import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Package, 
  Clock, 
  AlertTriangle, 
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
  quoted_price: number | null;
  quote_approved: boolean | null;
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch all orders for stats
      const { data: allData, error: allError } = await supabase
        .from('orders')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (allError) throw allError;
      setAllOrders(allData || []);
      setOrders((allData || []).slice(0, 4));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = allOrders.length;
  const ongoingOrders = allOrders.filter(o => 
    ['queued', 'sand-blasting', 'coating', 'curing', 'quality-check'].includes(o.status)
  ).length;
  const delayedOrders = allOrders.filter(o => o.status === 'delayed').length;
  const pendingQuoteOrders = allOrders.filter(o => o.status === 'pending_quote').length;
  
  // Calculate real revenue from quoted_price of approved/completed orders
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthlyRevenue = allOrders
    .filter(o => 
      o.quote_approved && 
      o.quoted_price && 
      new Date(o.submitted_date) >= monthStart
    )
    .reduce((sum, o) => sum + (Number(o.quoted_price) || 0), 0);

  const kpis = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      change: `${pendingQuoteOrders} pending`,
      trend: 'up',
      icon: Package,
      description: 'All time',
    },
    {
      title: 'Ongoing Projects',
      value: ongoingOrders.toString(),
      change: 'In production',
      trend: 'up',
      icon: Clock,
      description: 'Currently active',
    },
    {
      title: 'Delayed Projects',
      value: delayedOrders.toString(),
      change: delayedOrders > 0 ? 'Needs attention' : 'All on track',
      trend: delayedOrders > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      description: 'Needs attention',
    },
    {
      title: 'Revenue (MTD)',
      value: monthlyRevenue >= 1000000 
        ? `₱${(monthlyRevenue / 1000000).toFixed(1)}M`
        : monthlyRevenue >= 1000
        ? `₱${(monthlyRevenue / 1000).toFixed(1)}K`
        : `₱${monthlyRevenue.toLocaleString()}`,
      change: 'From approved quotes',
      trend: 'up',
      icon: DollarSign,
      description: 'Month to date',
    },
  ];

  // Production stats using correct database enum values
  const productionStats = [
    { stage: 'Pending Quote', count: allOrders.filter(o => o.status === 'pending_quote').length, color: 'bg-yellow-500' },
    { stage: 'Queued', count: allOrders.filter(o => o.status === 'queued').length, color: 'bg-blue-500' },
    { stage: 'Sand Blasting', count: allOrders.filter(o => o.status === 'sand-blasting').length, color: 'bg-orange-500' },
    { stage: 'Coating', count: allOrders.filter(o => o.status === 'coating').length, color: 'bg-primary' },
    { stage: 'Curing', count: allOrders.filter(o => o.status === 'curing').length, color: 'bg-purple-500' },
    { stage: 'Quality Check', count: allOrders.filter(o => o.status === 'quality-check').length, color: 'bg-indigo-500' },
    { stage: 'Completed', count: allOrders.filter(o => o.status === 'completed').length, color: 'bg-green-500' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_quote': 'bg-yellow-500 text-white',
      'queued': 'bg-blue-500 text-white',
      'sand-blasting': 'bg-orange-500 text-white',
      'coating': 'bg-primary text-primary-foreground',
      'curing': 'bg-purple-500 text-white',
      'quality-check': 'bg-indigo-500 text-white',
      'completed': 'bg-green-500 text-white',
      'delayed': 'bg-red-500 text-white',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ').replace('_', ' ');
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'urgent': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white',
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
                  <div 
                    key={order.id} 
                    className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
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
                          {formatStatus(order.status)}
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
