import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Phone
} from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app, fetch based on id
  const orderData = {
    orderId: 'ORD-2025-001',
    status: 'coating',
    submittedDate: '2025-01-20',
    estimatedCompletion: '2025-01-25',
    clientInfo: {
      name: 'John Doe',
      company: 'ABC Manufacturing Inc.',
      email: 'john.doe@abcmfg.com',
      phone: '+63 912 345 6789',
      address: '123 Industrial Ave, Makati City, Metro Manila'
    },
    orderDetails: {
      projectName: 'Aluminum Window Frames Project',
      itemDescription: 'High-quality aluminum window frames for commercial building',
      quantity: '12 pieces',
      dimensions: '2m x 1.5m',
      additionalNotes: 'Handle with care during transport'
    },
    customization: {
      finish: 'Matte',
      texture: 'Smooth',
      color: 'Black',
      notes: 'Premium matte finish required for outdoor use'
    },
    uploadedFiles: [
      { name: 'technical_drawing.pdf', size: 2456 },
      { name: 'reference_photo.jpg', size: 1234 }
    ]
  };

  const handleDownloadPDF = () => {
    console.log('Downloading order summary PDF...');
  };

  return (
    <div className="min-h-screen bg-background pt-20">
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
            <h1 className="text-4xl font-bold text-foreground mb-2">{orderData.orderId}</h1>
            <p className="text-muted-foreground">Order Details and Summary</p>
          </div>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <Badge className="bg-primary text-primary-foreground">
                  {orderData.status.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
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
                      {new Date(orderData.submittedDate).toLocaleDateString('en-US', {
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
                      {new Date(orderData.estimatedCompletion).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
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
                  <p className="font-medium">{orderData.clientInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.clientInfo.company}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.clientInfo.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{orderData.clientInfo.phone}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-medium">{orderData.clientInfo.address}</p>
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
                <p className="font-medium text-lg">{orderData.orderDetails.projectName}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Item Description</p>
                <p className="font-medium">{orderData.orderDetails.itemDescription}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p className="font-medium">{orderData.orderDetails.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                  <p className="font-medium">{orderData.orderDetails.dimensions}</p>
                </div>
              </div>
              {orderData.orderDetails.additionalNotes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
                    <p className="font-medium">{orderData.orderDetails.additionalNotes}</p>
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
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Finish</p>
                  <p className="font-semibold text-lg">{orderData.customization.finish}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Texture</p>
                  <p className="font-semibold text-lg">{orderData.customization.texture}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Color</p>
                  <p className="font-semibold text-lg">{orderData.customization.color}</p>
                </div>
              </div>
              {orderData.customization.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customization Notes</p>
                    <p className="font-medium">{orderData.customization.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {orderData.uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orderData.uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
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
