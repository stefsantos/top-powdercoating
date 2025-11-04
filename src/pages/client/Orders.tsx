import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Clock, 
  Zap, 
  Eye, 
  CheckCircle, 
  Loader2,
  Droplets,
  Sparkles,
  Shield
} from 'lucide-react';

interface Order {
  id: string;
  orderId: string;
  description: string;
  currentStatus: 'queued' | 'sand-blasting' | 'coating' | 'curing' | 'quality-check' | 'ready-pickup' | 'completed';
  estimatedCompletion: string;
  submittedDate: string;
  progress: number;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderId: 'ORD-2025-001',
    description: 'Aluminum Window Frames - Matte Black',
    currentStatus: 'coating',
    estimatedCompletion: '2025-01-25',
    submittedDate: '2025-01-20',
    progress: 60
  },
  {
    id: '2',
    orderId: 'ORD-2025-002',
    description: 'Steel Gates - Glossy White',
    currentStatus: 'sand-blasting',
    estimatedCompletion: '2025-01-28',
    submittedDate: '2025-01-22',
    progress: 30
  },
  {
    id: '3',
    orderId: 'ORD-2025-003',
    description: 'Metal Railings - Textured Gray',
    currentStatus: 'queued',
    estimatedCompletion: '2025-01-30',
    submittedDate: '2025-01-23',
    progress: 10
  }
];

const statusSteps = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'sand-blasting', label: 'Sand Blasting', icon: Zap },
  { key: 'coating', label: 'Coating', icon: Droplets },
  { key: 'curing', label: 'Curing', icon: Loader2 },
  { key: 'quality-check', label: 'Quality Check', icon: Shield },
  { key: 'ready-pickup', label: 'Ready', icon: CheckCircle }
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState('in-progress');

  const getStatusColor = (status: string) => {
    const colors = {
      'queued': 'bg-muted text-muted-foreground',
      'sand-blasting': 'bg-accent text-accent-foreground',
      'coating': 'bg-primary text-primary-foreground',
      'curing': 'bg-secondary text-secondary-foreground',
      'quality-check': 'bg-accent text-accent-foreground',
      'ready-pickup': 'bg-primary text-primary-foreground',
      'completed': 'bg-primary text-primary-foreground'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const inProgressOrders = mockOrders.filter(o => o.currentStatus !== 'completed');
  const completedOrders = mockOrders.filter(o => o.currentStatus === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track your powder coating orders</p>
          </div>
          <Link to="/client/orders/new">
            <Button size="lg" className="gap-2">
              <Package className="h-5 w-5" />
              Create New Order
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-6">
            {inProgressOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders in progress</p>
                  <Link to="/client/orders/new">
                    <Button className="mt-4">Create Your First Order</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              inProgressOrders.map(order => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{order.orderId}</CardTitle>
                        <p className="text-sm text-muted-foreground">{order.description}</p>
                      </div>
                      <Badge className={getStatusColor(order.currentStatus)}>
                        {statusSteps[getStatusIndex(order.currentStatus)]?.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>

                      {/* Status Timeline */}
                      <div className="relative">
                        <div className="flex justify-between items-start">
                          {statusSteps.map((step, index) => {
                            const Icon = step.icon;
                            const currentIndex = getStatusIndex(order.currentStatus);
                            const isActive = index <= currentIndex;
                            const isCurrent = index === currentIndex;

                            return (
                              <div key={step.key} className="flex flex-col items-center flex-1">
                                <div className={`
                                  rounded-full p-3 mb-2 transition-all
                                  ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                                `}>
                                  <Icon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                                </div>
                                <span className={`text-xs text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                          <p className="font-medium">{new Date(order.submittedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Est. Completion</p>
                          <p className="font-medium">{new Date(order.estimatedCompletion).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <Link to={`/client/orders/${order.id}`}>
                        <Button variant="outline" className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed">
            <Link to="/client/orders/history">
              <Button variant="outline" className="mb-6">
                View Full Order History
              </Button>
            </Link>
            {completedOrders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed orders yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
