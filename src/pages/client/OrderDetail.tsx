import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  User, 
  Package, 
  FileText, 
  Palette,
  CheckCircle,
  Building,
  Mail,
  Phone,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  submitted_date: string;
  estimated_completion: string | null;
  project_name: string;
  description: string;
  quantity: number;
  dimensions: string | null;
  additional_notes: string | null;
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
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view order details');
        navigate('/login');
        return;
      }

      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;
      if (!order) {
        toast.error('Order not found');
        navigate('/client/orders');
        return;
      }

      // Fetch customization
      const { data: customization } = await supabase
        .from('order_customizations')
        .select('*')
        .eq('order_id', id)
        .single();

      // Fetch files
      const { data: files } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', id);

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company, phone')
        .eq('id', user.id)
        .single();

      setOrderData({
        ...order,
        customization: customization || undefined,
        files: files || [],
        profile: profile || undefined,
        user_email: user.email
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!orderData) return;
    
    setApproving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          quote_approved: true,
          quote_approved_at: new Date().toISOString(),
          status: 'queued' as any // Move to queued after approval
        })
        .eq('id', orderData.id);

      if (error) throw error;

      toast.success('Quote approved! Your order is now queued for production.');
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ').replace('_', ' ');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_quote': 'bg-yellow-500 text-white',
      'queued': 'bg-blue-500 text-white',
      'sand-blasting': 'bg-orange-500 text-white',
      'coating': 'bg-primary text-primary-foreground',
      'curing': 'bg-purple-500 text-white',
      'quality-check': 'bg-indigo-500 text-white',
      'completed': 'bg-green-500 text-white',
      'delayed': 'bg-red-500 text-white',
    };
    return colors[status] || 'bg-muted';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-muted-foreground">Order not found</p>
        </div>
      </div>
    );
  }

  const showQuoteApproval = orderData.status === 'pending_quote' && orderData.quoted_price && !orderData.quote_approved;

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/client/orders')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{orderData.order_number}</h1>
            <p className="text-muted-foreground">Order Details and Summary</p>
          </div>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-6">
          {/* Quote Approval Card - Show prominently if quote is ready */}
          {showQuoteApproval && (
            <Card className="border-yellow-500 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <DollarSign className="h-5 w-5" />
                  Quote Ready for Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quoted Price</p>
                    <p className="text-3xl font-bold text-foreground">
                      ₱{Number(orderData.quoted_price).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleApproveQuote}
                    disabled={approving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Quote
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  By approving this quote, you confirm the price and authorize us to begin production on your order.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <Badge className={getStatusColor(orderData.status)}>
                  {formatStatus(orderData.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted Date</p>
                    <p className="font-medium">
                      {new Date(orderData.submitted_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Completion</p>
                    <p className="font-medium">
                      {orderData.estimated_completion 
                        ? new Date(orderData.estimated_completion).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'TBD (pending quote approval)'
                      }
                    </p>
                  </div>
                </div>
                {orderData.quoted_price && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quote</p>
                      <p className="font-medium">
                        ₱{Number(orderData.quoted_price).toLocaleString()}
                        {orderData.quote_approved && (
                          <Badge className="ml-2 bg-green-500 text-white">Approved</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{orderData.profile?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.profile?.company || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.user_email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.profile?.phone || 'N/A'}</p>
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
              <div>
                <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                <p className="font-medium text-lg">{orderData.project_name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Item Description</p>
                <p className="font-medium">{orderData.description}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p className="font-medium">{orderData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                  <p className="font-medium">{orderData.dimensions || 'N/A'}</p>
                </div>
              </div>
              {orderData.additional_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
                    <p className="font-medium">{orderData.additional_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customization Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Customization Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderData.customization ? (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Finish</p>
                      <p className="font-semibold text-lg capitalize">{orderData.customization.finish}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Texture</p>
                      <p className="font-semibold text-lg capitalize">{orderData.customization.texture}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Color</p>
                      <p className="font-semibold text-lg">{orderData.customization.color}</p>
                    </div>
                  </div>
                  {orderData.customization.custom_notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Customization Notes</p>
                        <p className="font-medium">{orderData.customization.custom_notes}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No customization details available</p>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {orderData.files && orderData.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orderData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file_size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
