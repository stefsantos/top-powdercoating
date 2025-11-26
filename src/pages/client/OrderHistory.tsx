import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Search, 
  Eye, 
  RotateCcw, 
  Download,
  ArrowLeft,
  Loader2,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface HistoryOrder {
  id: string;
  order_number: string;
  description: string;
  status: string;
  submitted_date: string;
  completed_date: string | null;
  quantity: number;
  quoted_price: number | null;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders(searchQuery, statusFilter);
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view order history');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'delayed'])
        .order('completed_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const filterOrders = (query: string, status: string) => {
    let filtered = orders;

    if (query) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(query.toLowerCase()) ||
        order.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status);
    }

    setFilteredOrders(filtered);
  };

  const handleReorder = (order: HistoryOrder) => {
    toast.success('Redirecting to order creation...', {
      description: `Create a new order based on ${order.order_number}`
    });
    navigate('/client/create-order');
  };

  const handleDownloadInvoice = (order: HistoryOrder) => {
    toast.info('Invoice download coming soon', {
      description: `Invoice for ${order.order_number}`
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'completed' ? 'default' : 'destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link to="/client/orders">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Order History</h1>
          <p className="text-muted-foreground">View your past orders and reorder items</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <CardTitle>Past Orders</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {orders.length === 0 ? 'No completed orders yet' : 'No orders found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.quantity} items
                              {order.quoted_price && ` • ₱${Number(order.quoted_price).toLocaleString()}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.submitted_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.completed_date 
                            ? new Date(order.completed_date).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/client/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'completed' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleReorder(order)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(order)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
