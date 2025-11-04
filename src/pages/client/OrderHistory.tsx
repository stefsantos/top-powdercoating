import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface HistoryOrder {
  id: string;
  orderId: string;
  description: string;
  status: 'completed' | 'cancelled';
  submittedDate: string;
  completionDate: string;
  specifications: {
    finish: string;
    color: string;
    texture: string;
    quantity: string;
  };
}

const mockOrders: HistoryOrder[] = [
  {
    id: '1',
    orderId: 'ORD-2024-089',
    description: 'Steel Gates - Glossy White',
    status: 'completed',
    submittedDate: '2024-12-15',
    completionDate: '2024-12-22',
    specifications: {
      finish: 'Glossy',
      color: 'White',
      texture: 'Smooth',
      quantity: '2 pieces'
    }
  },
  {
    id: '2',
    orderId: 'ORD-2024-078',
    description: 'Aluminum Railings - Matte Black',
    status: 'completed',
    submittedDate: '2024-11-20',
    completionDate: '2024-11-28',
    specifications: {
      finish: 'Matte',
      color: 'Black',
      texture: 'Textured',
      quantity: '15 pieces'
    }
  },
  {
    id: '3',
    orderId: 'ORD-2024-065',
    description: 'Metal Frames - Satin Gray',
    status: 'completed',
    submittedDate: '2024-10-10',
    completionDate: '2024-10-18',
    specifications: {
      finish: 'Satin',
      color: 'Gray',
      texture: 'Smooth',
      quantity: '8 pieces'
    }
  },
  {
    id: '4',
    orderId: 'ORD-2024-052',
    description: 'Window Frames - Matte Blue',
    status: 'cancelled',
    submittedDate: '2024-09-05',
    completionDate: '2024-09-06',
    specifications: {
      finish: 'Matte',
      color: 'Blue',
      texture: 'Smooth',
      quantity: '10 pieces'
    }
  }
];

export default function OrderHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState(mockOrders);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterOrders(query, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterOrders(searchQuery, status);
  };

  const filterOrders = (query: string, status: string) => {
    let filtered = mockOrders;

    if (query) {
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(query.toLowerCase()) ||
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
      description: `Specifications from ${order.orderId} will be pre-filled`
    });
  };

  const handleDownloadInvoice = (order: HistoryOrder) => {
    toast.success('Downloading invoice...', {
      description: `Invoice for ${order.orderId}`
    });
  };

  return (
    <div className="min-h-screen bg-background">
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
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No orders found</p>
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
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.specifications.finish} {order.specifications.color} • {order.specifications.quantity}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.submittedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(order.completionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'completed' ? 'default' : 'destructive'}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link to={`/client/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
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
