import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  submitted_date: string;
  estimated_completion: string | null;
  description: string;
  profiles?: { full_name: string };
}

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (profilesError) throw profilesError;

      // Map profiles to orders
      const ordersWithProfiles = (ordersData || []).map(order => ({
        ...order,
        profiles: profilesData?.find(p => p.id === order.user_id) || { full_name: 'Unknown' }
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (o.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    queued: orders.filter(o => o.status === 'received').length,
    inProgress: orders.filter(o => ['in_preparation', 'coating_in_progress', 'quality_check'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    delayed: 0
  };

  return (
    <ScrollArea className="h-screen">
      <div className="container mx-auto p-6 max-w-7xl pt-24">
      <h1 className="text-4xl font-bold mb-8">Order Management</h1>
      
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="pt-6"><Clock className="h-6 w-6 mb-2" /><div className="text-2xl font-bold">{stats.queued}</div><p className="text-sm text-muted-foreground">Queued</p></CardContent></Card>
        <Card><CardContent className="pt-6"><Package className="h-6 w-6 mb-2" /><div className="text-2xl font-bold">{stats.inProgress}</div><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6"><CheckCircle2 className="h-6 w-6 mb-2" /><div className="text-2xl font-bold">{stats.completed}</div><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="pt-6"><AlertCircle className="h-6 w-6 mb-2" /><div className="text-2xl font-bold">{stats.delayed}</div><p className="text-sm text-muted-foreground">Delayed</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in_preparation">In Preparation</SelectItem>
                <SelectItem value="coating_in_progress">Coating</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                  <TableCell><Badge>{order.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ScrollArea>
  );
}