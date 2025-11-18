import { useState } from 'react';
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
  Mail,
  Phone,
  Building,
  Package,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalOrders: number;
  activeOrders: number;
  totalValue: number;
  status: 'active' | 'inactive' | 'vip';
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'John Doe',
    company: 'ABC Manufacturing Inc.',
    email: 'john.doe@abcmfg.com',
    phone: '+63 912 345 6789',
    address: '123 Industrial Ave, Makati City',
    joinDate: '2024-01-15',
    totalOrders: 15,
    activeOrders: 2,
    totalValue: 450000,
    status: 'vip'
  },
  {
    id: '2',
    name: 'Jane Smith',
    company: 'XYZ Industries Corp.',
    email: 'jane.smith@xyzind.com',
    phone: '+63 923 456 7890',
    address: '456 Business Park, Taguig City',
    joinDate: '2024-03-20',
    totalOrders: 8,
    activeOrders: 1,
    totalValue: 280000,
    status: 'active'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    company: 'DEF Construction Ltd.',
    email: 'bob.j@defconst.com',
    phone: '+63 934 567 8901',
    address: '789 Builder St, Quezon City',
    joinDate: '2024-06-10',
    totalOrders: 3,
    activeOrders: 1,
    totalValue: 120000,
    status: 'active'
  }
];

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-primary text-primary-foreground',
      'inactive': 'bg-muted text-muted-foreground',
      'vip': 'bg-destructive text-destructive-foreground'
    };
    return colors[status as keyof typeof colors];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Client Management</h1>
          <p className="text-muted-foreground">Manage your client relationships and information</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockClients.length}</p>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockClients.filter(c => c.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
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
                  <p className="text-2xl font-bold">{mockClients.filter(c => c.status === 'vip').length}</p>
                  <p className="text-sm text-muted-foreground">VIP Clients</p>
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
                    ₱{(mockClients.reduce((sum, c) => sum + c.totalValue, 0) / 1000).toFixed(0)}K
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
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{client.company}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{client.phone}</span>
                          </div>
                        </div>
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
                                    <p className="text-muted-foreground">{selectedClient.company}</p>
                                    <Badge className={`${getStatusColor(selectedClient.status)} mt-2`}>
                                      {selectedClient.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{selectedClient.email}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{selectedClient.phone}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Address</p>
                                      <p className="font-medium">{selectedClient.address}</p>
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
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">₱{selectedClient.totalValue.toLocaleString()}</p>
                                      </div>
                                    </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
    </ScrollArea>
  );
}
