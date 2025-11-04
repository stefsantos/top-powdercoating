import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderId: string;
  clientName: string;
  clientCompany: string;
  description: string;
  status: 'queued' | 'sand-blasting' | 'coating' | 'curing' | 'quality-check' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  submittedDate: string;
  estimatedCompletion: string;
  progress: number;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderId: 'ORD-2025-001',
    clientName: 'John Doe',
    clientCompany: 'ABC Manufacturing',
    description: 'Aluminum Window Frames - Matte Black',
    status: 'coating',
    priority: 'high',
    submittedDate: '2025-01-20',
    estimatedCompletion: '2025-01-25',
    progress: 60
  },
  {
    id: '2',
    orderId: 'ORD-2025-002',
    clientName: 'Jane Smith',
    clientCompany: 'XYZ Industries',
    description: 'Steel Gates - Glossy White',
    status: 'sand-blasting',
    priority: 'medium',
    submittedDate: '2025-01-22',
    estimatedCompletion: '2025-01-28',
    progress: 30
  },
  {
    id: '3',
    orderId: 'ORD-2025-003',
    clientName: 'Bob Johnson',
    clientCompany: 'DEF Construction',
    description: 'Metal Railings - Textured Gray',
    status: 'queued',
    priority: 'low',
    submittedDate: '2025-01-23',
    estimatedCompletion: '2025-01-30',
    progress: 10
  }
];

export default function OrderManagement() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const getStatusColor = (status: string) => {
    const colors = {
      'queued': 'bg-muted text-muted-foreground',
      'sand-blasting': 'bg-accent text-accent-foreground',
      'coating': 'bg-primary text-primary-foreground',
      'curing': 'bg-secondary text-secondary-foreground',
      'quality-check': 'bg-accent text-accent-foreground',
      'completed': 'bg-primary text-primary-foreground',
      'delayed': 'bg-destructive text-destructive-foreground'
    };
    return colors[status as keyof typeof colors];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-muted text-muted-foreground',
      'medium': 'bg-accent text-accent-foreground',
      'high': 'bg-destructive text-destructive-foreground'
    };
    return colors[priority as keyof typeof colors];
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;

    setOrders(orders.map(order => 
      order.id === selectedOrder.id 
        ? { ...order, status: newStatus as Order['status'] }
        : order
    ));

    toast.success('Order status updated', {
      description: `${selectedOrder.orderId} is now ${newStatus}`
    });

    setSelectedOrder(null);
    setNewStatus('');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientCompany.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Order Management</h1>
          <p className="text-muted-foreground">Manage and track all client orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'queued').length}</p>
                  <p className="text-sm text-muted-foreground">Queued</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Edit className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => ['sand-blasting', 'coating', 'curing'].includes(o.status)).length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'delayed').length}</p>
                  <p className="text-sm text-muted-foreground">Delayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <CardTitle>All Orders</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sand-blasting">Sand Blasting</SelectItem>
                    <SelectItem value="coating">Coating</SelectItem>
                    <SelectItem value="curing">Curing</SelectItem>
                    <SelectItem value="quality-check">Quality Check</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.clientName}</p>
                          <p className="text-xs text-muted-foreground">{order.clientCompany}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.estimatedCompletion).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(order.status);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Order ID</p>
                                    <p className="font-medium">{selectedOrder.orderId}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor="status">New Status</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger id="status">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="queued">Queued</SelectItem>
                                        <SelectItem value="sand-blasting">Sand Blasting</SelectItem>
                                        <SelectItem value="coating">Coating</SelectItem>
                                        <SelectItem value="curing">Curing</SelectItem>
                                        <SelectItem value="quality-check">Quality Check</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="delayed">Delayed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button onClick={handleUpdateStatus} className="w-full">
                                    Update Status
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
