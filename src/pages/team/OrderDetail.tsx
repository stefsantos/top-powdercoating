import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Package, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetails {
  id: string;
  order_number: string;
  project_name: string;
  description: string;
  status: string;
  priority: string;
  quantity: number;
  dimensions: string | null;
  additional_notes: string | null;
  progress: number | null;
  submitted_date: string;
  estimated_completion: string | null;
  completed_date: string | null;
}

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
}

interface Customization {
  color: string;
  finish: string;
  texture: string;
  custom_notes: string | null;
}

export default function TeamOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [customization, setCustomization] = useState<Customization | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order files
      const { data: filesData, error: filesError } = await supabase.from("order_files").select("*").eq("order_id", id);

      if (filesError) throw filesError;
      setFiles(filesData || []);

      // Fetch customizations
      const { data: customData, error: customError } = await supabase
        .from("order_customizations")
        .select("*")
        .eq("order_id", id)
        .single();

      if (!customError && customData) {
        setCustomization(customData);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_date: new Date().toISOString(),
          progress: 100,
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order Completed! 🎉",
        description: `Order ${order.order_number} has been marked as completed`,
      });

      navigate("/team/dashboard");
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_quote: "bg-yellow-500",
      queued: "bg-blue-500",
      "sand-blasting": "bg-orange-500",
      coating: "bg-purple-500",
      curing: "bg-pink-500",
      "quality-check": "bg-teal-500",
      completed: "bg-green-500",
      delayed: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
      urgent: "bg-red-200 text-red-900",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Order not found</h2>
          <Button onClick={() => navigate("/team/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:p-20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/team/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{order.order_number}</h1>
              <p className="text-muted-foreground">{order.project_name}</p>
            </div>
          </div>
          {order.status !== "completed" && (
            <Button onClick={handleCompleteOrder}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>

        {/* Status and Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Status</CardTitle>
              <div className="flex gap-2">
                <Badge className={getStatusColor(order.status)}>{order.status.replace("-", " ")}</Badge>
                <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{order.progress || 0}%</span>
              </div>
              <Progress value={order.progress || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{order.quantity} units</p>
                </div>
              </div>

              {order.dimensions && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-medium">{order.dimensions}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(order.submitted_date).toLocaleDateString()}</p>
                </div>
              </div>

              {order.estimated_completion && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Completion</p>
                    <p className="font-medium">{new Date(order.estimated_completion).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-foreground">{order.description}</p>
            </div>

            {order.additional_notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Additional Notes</p>
                  <p className="text-foreground">{order.additional_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customization Details */}
        {customization && (
          <Card>
            <CardHeader>
              <CardTitle>Customization</CardTitle>
              <CardDescription>Coating specifications for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: customization.color }}
                    />
                    <p className="font-medium">{customization.color}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Finish</p>
                  <p className="font-medium capitalize">{customization.finish}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Texture</p>
                  <p className="font-medium capitalize">{customization.texture}</p>
                </div>
              </div>
              {customization.custom_notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Custom Notes</p>
                    <p className="text-foreground">{customization.custom_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attached Files */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attached Files</CardTitle>
              <CardDescription>{files.length} file(s) attached</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(file.file_url, "_blank")}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
