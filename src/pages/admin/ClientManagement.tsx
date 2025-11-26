import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Eye,
  Phone,
  Building,
  Package,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  isAdmin: boolean;
  joinDate: string;
  totalOrders: number;
  activeOrders: number;
  totalValue: number;
  status: 'active' | 'inactive' | 'admin';
  lastOrderDate: string | null;
}

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (clients)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all orders with their data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch user roles to check for admins
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Calculate 30 days ago for active status
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Map profiles to clients with order statistics
      const clientsData: Client[] = (profiles || []).map(profile => {
        const userOrders = (orders || []).filter(order => order.user_id === profile.id);
        
        // Count orders that are NOT completed or delayed (these are "active" in-progress orders)
        const activeOrders = userOrders.filter(order => 
          !['completed', 'delayed'].includes(order.status)
        ).length;
        
        // Calculate total revenue from quoted prices (only approved quotes)
        const totalValue = userOrders.reduce((sum, order) => {
          if (order.quote_approved && order.quoted_price) {
            return sum + Number(order.quoted_price);
          }
          return sum;
        }, 0);

        // Get last order date
        const sortedOrders = [...userOrders].sort((a, b) => 
          new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime()
        );
        const lastOrderDate = sortedOrders[0]?.submitted_date || null;

        // Check if user is admin
        const isAdmin = (userRoles || []).some(
          role => role.user_id === profile.id && role.role === 'admin'
        );

        // Determine status: admin > active (order in last 30 days) > inactive
        let status: 'active' | 'inactive' | 'admin' = 'inactive';
        if (isAdmin) {
          status = 'admin';
        } else {
          const hasRecentOrder = userOrders.some(order => 
            new Date(order.submitted_date) > thirtyDaysAgo
          );
          status = hasRecentOrder ? 'active' : 'inactive';
        }

        return {
          id: profile.id,
          name: profile.full_name || 'Unknown',
          company: profile.company,
          phone: profile.phone,
          isAdmin,
          joinDate: profile.created_at,
          totalOrders: userOrders.length,
          activeOrders,
          totalValue,
          status,
          lastOrderDate
        };
      });

      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-primary text-primary-foreground',
      'inactive': 'bg-muted text-muted-foreground',
      'admin': 'bg-destructive text-destructive-foreground'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter out admins from display list but keep them in stats
  const displayClients = clients.filter(client => !client.isAdmin);

  const filteredClients = displayClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const stats = {
    total: displayClients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    admins: clients.filter(c => c.status === 'admin').length,
    totalRevenue: displayClients.reduce((sum, c) => sum + c.totalValue, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Client Management</h1>
          <p className="text-muted-foreground">Manage your client relationships and information</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Building className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <UserX className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-sm text-muted-foreground">Inactive Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Users className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₱{stats.totalRevenue >= 1000000 
                      ? `${(stats.totalRevenue / 1000000).toFixed(1)}M`
                      : stats.totalRevenue >= 1000 
                      ? `${(stats.totalRevenue / 1000).toFixed(1)}K` 
                      : stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <CardTitle>All Clients</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {displayClients.length === 0 
                  ? 'No clients found. Clients will appear here when they sign up.'
                  : 'No clients match your search.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(client.joinDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.company ? (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{client.company}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.phone ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{client.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">No phone</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.totalOrders} total</p>
                            <p className="text-xs text-muted-foreground">{client.activeOrders} active</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₱{client.totalValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Client Details</DialogTitle>
                              </DialogHeader>
                              {selectedClient && (
                                <div className="space-y-6 pt-4">
                                  <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                        {getInitials(selectedClient.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h3 className="text-xl font-semibold">{selectedClient.name}</h3>
                                      <p className="text-muted-foreground">
                                        {selectedClient.company || 'No company'}
                                      </p>
                                      <Badge className={`${getStatusColor(selectedClient.status)} mt-2`}>
                                        {selectedClient.status.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>

                                  <Separator />

                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <p className="font-medium">
                                            {selectedClient.phone || 'Not provided'}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">Last Order</p>
                                        <p className="font-medium">
                                          {selectedClient.lastOrderDate 
                                            ? new Date(selectedClient.lastOrderDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })
                                            : 'No orders yet'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">Join Date</p>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <p className="font-medium">
                                            {new Date(selectedClient.joinDate).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                                        <div className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                          <p className="font-medium">
                                            {selectedClient.totalOrders} orders ({selectedClient.activeOrders} active)
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-5 w-5 text-primary" />
                                      <p className="text-2xl font-bold">
                                        ₱{selectedClient.totalValue.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
    </ScrollArea>
  );
}
