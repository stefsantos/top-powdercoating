import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignedOrder {
  id: string;
  order_number: string;
  project_name: string;
  status: string;
  priority: string;
  description: string;
  estimated_completion: string | null;
}

interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  availability: string;
  status: string;
}

export default function TeamDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMemberData();
  }, []);

  const fetchTeamMemberData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team member profile
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;
      setProfile(memberData);

      // Get assigned orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('order_team_assignments')
        .select(`
          order_id,
          orders (
            id,
            order_number,
            project_name,
            status,
            priority,
            description,
            estimated_completion
          )
        `)
        .eq('team_member_id', memberData.id);

      if (ordersError) throw ordersError;

      const orders = ordersData
        .map((assignment: any) => assignment.orders)
        .filter((order: any) => order && order.status !== 'completed');

      setAssignedOrders(orders);
    } catch (error) {
      console.error('Error fetching team member data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!profile) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ availability: newStatus })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, availability: newStatus });
      toast({
        title: 'Status Updated',
        description: `Your status has been set to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteOrder = async (orderId: string, orderNumber: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_date: new Date().toISOString(),
          progress: 100,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Order Completed! 🎉',
        description: `Order ${orderNumber} has been marked as completed`,
      });

      // Refresh the orders list
      fetchTeamMemberData();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete order',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_quote': 'bg-yellow-500',
      'queued': 'bg-blue-500',
      'sand-blasting': 'bg-orange-500',
      'coating': 'bg-purple-500',
      'curing': 'bg-pink-500',
      'quality-check': 'bg-teal-500',
      'completed': 'bg-green-500',
      'delayed': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.name}</h1>
            <p className="text-muted-foreground">
              {profile?.role} - {profile?.department}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Status</p>
              <Select
                value={profile?.availability}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="capitalize">{profile?.availability}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{profile?.department}</div>
            </CardContent>
          </Card>
        </div>

        {/* To-Do List */}
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Orders assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedOrders.map((order) => (
                  <Card key={order.id} className="border-2 cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="pt-6" onClick={() => window.location.href = `/team/orders/${order.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{order.order_number}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {order.project_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.description}
                          </p>
                          {order.estimated_completion && (
                            <p className="text-xs text-muted-foreground">
                              Est. Completion: {new Date(order.estimated_completion).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteOrder(order.id, order.order_number);
                          }}
                          className="ml-4"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
