import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Calendar,
  User,
  Package,
  FileText,
  Palette,
  Building,
  Mail,
  Phone,
  Clock,
  Zap,
  Shield,
  CheckCircle,
  Users,
  History,
  Loader2,
  DollarSign,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";

interface QuoteNegotiation {
  id: string;
  quoted_by: string;
  quoted_price: number;
  notes: string | null;
  status: string;
  created_at: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  submitted_date: string;
  estimated_completion: string | null;
  completed_date: string | null;
  project_name: string;
  description: string;
  quantity: number;
  dimensions: string | null;
  additional_notes: string | null;
  progress: number;
  quoted_price: number | null;
  quote_approved: boolean | null;
  customization?: {
    finish: string;
    texture: string;
    color: string;
    custom_notes: string | null;
  };
  files?: Array<{
    file_name: string;
    file_size: number;
    file_url: string;
  }>;
  profile?: {
    full_name: string;
    company: string | null;
    phone: string | null;
  };
  user_email?: string;
  user_id?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
}

// Updated to match database enum values - includes pending_quote
const statusSteps = [
  {
    key: "pending_quote",
    label: "Pending Quote",
    icon: DollarSign,
    color: "bg-yellow-500",
    description: "Awaiting price quote",
  },
  { key: "queued", label: "Queued", icon: Clock, color: "bg-blue-500", description: "Order queued for production" },
  {
    key: "sand-blasting",
    label: "Sand Blasting",
    icon: Package,
    color: "bg-orange-500",
    description: "Surface preparation",
  },
  { key: "coating", label: "Coating", icon: Package, color: "bg-orange-500", description: "Coating application" },
  { key: "curing", label: "Curing", icon: Zap, color: "bg-purple-500", description: "Heat curing process" },
  {
    key: "quality-check",
    label: "Quality Check",
    icon: Shield,
    color: "bg-indigo-500",
    description: "Quality assurance",
  },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-500", description: "Ready for pickup" },
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedTeamMembers, setAssignedTeamMembers] = useState<string[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string } | null>(null);
  const [negotiations, setNegotiations] = useState<QuoteNegotiation[]>([]);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  // Editable fields
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [progress, setProgress] = useState(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [notes, setNotes] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
      fetchTeamMembers();
      fetchStatusHistory();
      fetchNegotiations();
    }
  }, [id]);

  // Auto-update progress when status changes
  useEffect(() => {
    const progressMap: Record<string, number> = {
      pending_quote: 0,
      queued: 10,
      "sand-blasting": 25,
      coating: 50,
      curing: 70,
      "quality-check": 85,
      completed: 100,
    };

    if (status in progressMap) {
      setProgress(progressMap[status]);
    }
    // For 'delayed' or other statuses, keep current progress
  }, [status]);

  const fetchOrderDetails = async () => {
    try {
      const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single();

      if (orderError) throw orderError;

      // Fetch customization
      const { data: customization } = await supabase
        .from("order_customizations")
        .select("*")
        .eq("order_id", id)
        .single();

      // Fetch files
      const { data: files } = await supabase.from("order_files").select("*").eq("order_id", id);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company, phone")
        .eq("id", order.user_id)
        .single();

      // Fetch assigned team members
      const { data: assignments } = await supabase
        .from("order_team_assignments")
        .select("team_member_id")
        .eq("order_id", id);

      setOrderData({
        ...order,
        customization: customization || undefined,
        files: files || [],
        profile: profile || undefined,
        user_id: order.user_id,
      });

      setStatus(order.status);
      setPriority(order.priority);
      setProgress(order.progress || 0);
      setEstimatedCompletion(order.estimated_completion ? order.estimated_completion.split("T")[0] : "");
      setNotes(order.additional_notes || "");
      setQuotedPrice(order.quoted_price ? order.quoted_price.toString() : "");
      setAssignedTeamMembers(assignments?.map((a) => a.team_member_id) || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.from("team_members").select("*").order("name");

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error("Error fetching status history:", error);
    }
  };

  const fetchNegotiations = async () => {
    try {
      const { data, error } = await supabase
        .from("quote_negotiations")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNegotiations(data || []);
    } catch (error) {
      console.error("Error fetching negotiations:", error);
    }
  };

  const handleSave = async () => {
    if (!orderData) return;

    setSaving(true);
    const previousStatus = orderData.status;
    const previousQuotedPrice = orderData.quoted_price;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prepare update data
      const updateData: any = {
        status: status as any,
        priority: priority as any,
        // progress is automatically set by the database trigger based on status
        estimated_completion: estimatedCompletion || null,
        additional_notes: notes,
        updated_at: new Date().toISOString(),
      };

      // Add quoted_price if provided
      if (quotedPrice) {
        updateData.quoted_price = parseFloat(quotedPrice);
      }

      // Check if we need to create a negotiation record
      const newQuotePrice = quotedPrice ? parseFloat(quotedPrice) : null;
      if (newQuotePrice) {
        // Check if there are any existing negotiations for this order
        const { data: existingNegotiations } = await supabase
          .from('quote_negotiations')
          .select('id')
          .eq('order_id', id)
          .limit(1);

        // Create negotiation record if:
        // 1. No negotiations exist yet (even if price hasn't changed)
        // 2. Price has changed from previous value
        const shouldCreateNegotiation = 
          !existingNegotiations || 
          existingNegotiations.length === 0 || 
          newQuotePrice !== previousQuotedPrice;

        if (shouldCreateNegotiation) {
          const { error: negError } = await supabase
            .from('quote_negotiations')
            .insert({
              order_id: id,
              quoted_by: user.id,
              quoted_price: newQuotePrice,
              notes: previousQuotedPrice && newQuotePrice !== previousQuotedPrice
                ? `Admin updated quote from ₱${previousQuotedPrice.toLocaleString()} to ₱${newQuotePrice.toLocaleString()}`
                : 'Initial quote from admin',
              status: 'pending',
            });

          if (negError) {
            console.error('Failed to create negotiation record:', negError);
            toast.error('Failed to save quote negotiation record');
            // Don't continue if negotiation record fails
            setSaving(false);
            return;
          }

          if (quotedPrice && quotedPrice !== previousQuotedPrice) {
            // Create notification for client
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: orderData.user_id,
                title: "Quote Received",
                message: `Your order ${orderData.order_number} has received a quote of $${quotedPrice}`,
                type: "quote",
                link: `/client/orders/${orderData.id}`,
              });

            if (notifError) {
              console.error("Error creating notification:", notifError);
            }
          }
        }
      }

      // Update order
      const { error: orderError } = await supabase.from("orders").update(updateData).eq("id", id);

      if (orderError) throw orderError;

      // Update team assignments
      const { error: deleteError } = await supabase.from("order_team_assignments").delete().eq("order_id", id);

      if (deleteError) throw deleteError;

      if (assignedTeamMembers.length > 0) {
        const assignments = assignedTeamMembers.map((memberId) => ({
          order_id: id!,
          team_member_id: memberId,
        }));

        const { error: insertError } = await supabase.from("order_team_assignments").insert(assignments);

        if (insertError) throw insertError;
      }

      // Send email notification if status changed
      if (status !== previousStatus && orderData.user_id) {
        try {
          const { error: notificationError } = await supabase.functions.invoke("send-order-notification", {
            body: {
              user_id: orderData.user_id,
              order_id: id,
              order_number: orderData.order_number,
              new_status: status,
              user_email: orderData.user_email,
            },
          });

          if (notificationError) {
            console.error("Failed to send email notification:", notificationError);
          } else {
            console.log("Email notification sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't fail the save if email fails
        }
      }

      toast.success("Order updated successfully");
      await fetchOrderDetails();
      await fetchStatusHistory();
      await fetchNegotiations();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitCounterOffer = async () => {
    if (!orderData || !counterPrice) return;
    
    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('quote_negotiations')
        .insert({
          order_id: id,
          quoted_by: user.id,
          quoted_price: price,
          notes: counterNotes || 'Counter-offer from admin',
          status: 'pending',
        });

      if (error) throw error;

      // Update order quoted price
      await supabase
        .from('orders')
        .update({ quoted_price: price })
        .eq('id', id);

      // Notification for client 
      await supabase
        .from("notifications")
        .insert({
          user_id: orderData.user_id,
          title: "Counter-Offer Received",
          message: `Admin sent a counter-offer of ₱${price.toLocaleString()} for order ${orderData.order_number}`,
          type: "quote",
          link: `/client/orders/${orderData.id}`,
      });

      toast.success('Counter-offer sent to client');
      setShowCounterOffer(false);
      setCounterPrice('');
      setCounterNotes('');
      await fetchNegotiations();
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error submitting counter-offer:', error);
      toast.error('Failed to submit counter-offer');
    }
  };

  const handleAcceptClientOffer = async (negotiationId: string, price: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark negotiation as accepted by admin
      const { error: negError } = await supabase
        .from('quote_negotiations')
        .insert({
          order_id: id,
          quoted_by: user.id,
          quoted_price: price,
          notes: 'Admin accepted client offer',
          status: 'accepted',
        });

      if (negError) throw negError;

      // Update order
      await supabase
        .from('orders')
        .update({
          quoted_price: price,
        })
        .eq('id', id);

      toast.success('Client offer accepted');
      await fetchNegotiations();
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
    }
  };

  const toggleTeamMember = (memberId: string) => {
    setAssignedTeamMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const getStatusIndex = (statusKey: string) => {
    return statusSteps.findIndex((step) => step.key === statusKey);
  };

  const isStatusActive = (stepIndex: number) => {
    const currentIndex = getStatusIndex(status);
    return stepIndex <= currentIndex;
  };

  const getStatusBadgeColor = (statusKey: string) => {
    switch (statusKey) {
      case "completed":
        return "bg-green-500 text-white";
      case "quality-check":
        return "bg-indigo-500 text-white";
      case "curing":
        return "bg-purple-500 text-white";
      case "coating":
      case "sand-blasting":
        return "bg-orange-500 text-white";
      case "queued":
        return "bg-blue-500 text-white";
      case "pending_quote":
        return "bg-yellow-500 text-white";
      case "delayed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priorityKey: string) => {
    switch (priorityKey) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Order not found</h2>
            <Button onClick={() => navigate("/admin/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{orderData.order_number}</h1>
                <p className="text-muted-foreground">Order Details & Management</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>

          {/* Quote Section - Show prominently if pending quote */}
          {(status === "pending_quote" || !orderData.quote_approved) && (
            <Card className="border-yellow-500 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <DollarSign className="h-5 w-5" />
                  Quote Management & Negotiation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Negotiation History */}
                {negotiations.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-semibold">Negotiation History</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {negotiations.map((neg) => {
                        const isClient = neg.quoted_by === orderData.user_id;
                        return (
                          <div
                            key={neg.id}
                            className={`p-3 rounded-lg border ${
                              isClient
                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">
                                {isClient ? 'Client' : 'Admin'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(neg.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              ₱{parseFloat(neg.quoted_price.toString()).toLocaleString()}
                            </p>
                            {neg.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{neg.notes}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  neg.status === 'accepted'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : neg.status === 'rejected'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : neg.status === 'countered'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {neg.status.charAt(0).toUpperCase() + neg.status.slice(1)}
                              </span>
                              {/* Allow admin to accept client counter-offers */}
                              {isClient && neg.status === 'countered' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcceptClientOffer(neg.id, neg.quoted_price)}
                                  className="ml-auto"
                                >
                                  Accept Offer
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Counter Offer Form */}
                {showCounterOffer ? (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-semibold">Submit Counter-Offer</h4>
                    <div className="space-y-2">
                      <Label htmlFor="counterPrice">Counter Price (₱)</Label>
                      <Input
                        id="counterPrice"
                        type="number"
                        step="0.01"
                        placeholder="Enter counter price"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="counterNotes">Notes (Optional)</Label>
                      <Textarea
                        id="counterNotes"
                        placeholder="Add notes or explanation"
                        value={counterNotes}
                        onChange={(e) => setCounterNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitCounterOffer} className="flex-1">
                        Submit Counter-Offer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCounterOffer(false);
                          setCounterPrice('');
                          setCounterNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quotedPrice">Quoted Price (₱)</Label>
                        <Input
                          id="quotedPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter quote amount"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quote Status</Label>
                        <div className="flex items-center gap-2 pt-2">
                          {orderData.quote_approved ? (
                            <Badge className="bg-green-500 text-white">Approved by Client</Badge>
                          ) : quotedPrice ? (
                            <Badge className="bg-yellow-500 text-white">Awaiting Client Response</Badge>
                          ) : (
                            <Badge className="bg-gray-500 text-white">No Quote Set</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCounterOffer(true)}
                        className="w-full md:w-auto"
                      >
                        Send Counter-Offer
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter a quote price and save to send it to the client. They can approve, decline, or send a counter-offer. The negotiation continues until both parties agree.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Overview & Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status & Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status & Priority */}
              <div className="flex items-center gap-4">
                <Badge className={getStatusBadgeColor(status)}>
                  {statusSteps.find((s) => s.key === status)?.label || status}
                </Badge>
                <Badge className={getPriorityColor(priority)}>{priority.toUpperCase()} Priority</Badge>
                {orderData.quoted_price && (
                  <Badge variant="outline">Quote: ₱{Number(orderData.quoted_price).toLocaleString()}</Badge>
                )}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Progress</Label>
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Status Timeline */}
              <div className="flex items-center justify-between px-4 md:p-2 overflow-x-auto">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = isStatusActive(index);
                  const isCurrent = status === step.key;

                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[80px]">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                          isActive ? step.color : "bg-muted"
                        } ${isCurrent ? "ring-4 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                      >
                        <Icon className={`h-6 w-6 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium text-center ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Edit Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusSteps.map((step) => (
                        <SelectItem key={step.key} value={step.key}>
                          {step.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimated Completion */}
              <div className="space-y-2">
                <Label htmlFor="estimated">Estimated Completion Date</Label>
                <Input
                  id="estimated"
                  type="date"
                  value={estimatedCompletion}
                  onChange={(e) => setEstimatedCompletion(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order & Client Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{orderData.profile?.full_name || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{orderData.profile?.company || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{orderData.user_email || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{orderData.profile?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Project Name</p>
                      <p className="font-medium">{orderData.project_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{orderData.quantity} items</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Submitted Date</p>
                      <p className="font-medium">{new Date(orderData.submitted_date).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">{orderData.dimensions || "Not specified"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="font-medium">{orderData.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customization Details */}
              {orderData.customization && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Customization Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Finish Type</p>
                        <p className="font-medium capitalize">{orderData.customization.finish}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Texture</p>
                        <p className="font-medium capitalize">{orderData.customization.texture}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: orderData.customization.color }}
                          />
                          <p className="font-medium">{orderData.customization.color}</p>
                        </div>
                      </div>
                    </div>

                    {orderData.customization.custom_notes && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Custom Notes</p>
                          <p className="font-medium">{orderData.customization.custom_notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Files */}
              {orderData.files && orderData.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Attached Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {orderData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.file_name}</p>
                              <p className="text-sm text-muted-foreground">{(file.file_size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingFile({ url: file.file_url, name: file.file_name })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes about this order..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Team & History */}
            <div className="space-y-6">
              {/* Team Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assign Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent">
                          <Checkbox
                            id={member.id}
                            checked={assignedTeamMembers.includes(member.id)}
                            onCheckedChange={() => toggleTeamMember(member.id)}
                          />
                          <div className="flex-1">
                            <label htmlFor={member.id} className="text-sm font-medium cursor-pointer">
                              {member.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {member.role} • {member.department}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Status History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {statusHistory.length > 0 ? (
                        statusHistory.map((item) => (
                          <div key={item.id} className="border-l-2 border-primary pl-4 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="capitalize">
                                {item.status.replace("-", " ").replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.changed_at).toLocaleString()}
                            </p>
                            {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No status changes yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
        imageUrl={viewingFile?.url || ""}
        fileName={viewingFile?.name || ""}
      />
    </ScrollArea>
  );
}
