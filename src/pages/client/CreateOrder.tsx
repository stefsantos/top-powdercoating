import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Palette,
  Sparkles,
  Grid3x3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ColorPickerWheel } from '@/components/ui/color-picker-wheel';

const finishOptions = [
  { value: 'matte', label: 'Matte', description: 'Non-reflective, smooth finish' },
  { value: 'glossy', label: 'Glossy', description: 'High-shine, reflective finish' },
  { value: 'satin', label: 'Satin', description: 'Semi-gloss, elegant finish' }
];

const textureOptions = [
  { value: 'smooth', label: 'Smooth', description: 'Flat, even surface' },
  { value: 'textured', label: 'Textured', description: 'Rough, grip-friendly surface' },
  { value: 'hammered', label: 'Hammered', description: 'Decorative dimpled pattern' }
];

const colorOptions = [
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'gray', label: 'Gray', hex: '#6B7280' },
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'green', label: 'Green', hex: '#10B981' },
  { value: 'custom', label: 'Custom', hex: null }
];

export default function CreateOrder() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'customize' | 'details'>('customize');
  const [finish, setFinish] = useState('matte');
  const [texture, setTexture] = useState('smooth');
  const [color, setColor] = useState('black');
  const [customColor, setCustomColor] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const [projectName, setProjectName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      toast.error('Some files are too large', {
        description: 'Maximum file size is 10MB per file'
      });
      return;
    }

    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/dwg'];
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dwg'));
    
    if (invalidTypes.length > 0) {
      toast.error('Invalid file type', {
        description: 'Only PDF, JPG, PNG, and DWG files are allowed'
      });
      return;
    }

    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    // Validate customization
    if (!finish || !texture || !color) {
      toast.error('Please complete all customization options');
      return;
    }

    if (customNotes && customNotes.length > 500) {
      toast.error('Customization notes must be less than 500 characters');
      return;
    }

    // Validate custom color if selected
    if (color === 'custom') {
      if (!customColor) {
        toast.error('Please enter a custom color code');
        return;
      }
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor)) {
        toast.error('Invalid color code. Please use hex format (e.g., #FF5733)');
        return;
      }
    }

    // Validate order details
    const trimmedProjectName = projectName.trim();
    const trimmedDescription = itemDescription.trim();
    const trimmedQuantity = quantity.trim();

    if (!trimmedProjectName) {
      toast.error('Project name is required');
      return;
    }

    if (trimmedProjectName.length > 100) {
      toast.error('Project name must be less than 100 characters');
      return;
    }

    if (!trimmedDescription) {
      toast.error('Item description is required');
      return;
    }

    if (trimmedDescription.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    if (trimmedDescription.length > 1000) {
      toast.error('Description must be less than 1000 characters');
      return;
    }

    if (!trimmedQuantity) {
      toast.error('Quantity is required');
      return;
    }

    const quantityNum = parseInt(trimmedQuantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      toast.error('Quantity must be a valid number');
      return;
    }

    if (dimensions && dimensions.trim().length > 100) {
      toast.error('Dimensions must be less than 100 characters');
      return;
    }

    if (additionalNotes && additionalNotes.trim().length > 1000) {
      toast.error('Additional notes must be less than 1000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create an order');
        return;
      }

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');
      
      if (orderNumberError) throw orderNumberError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumberData,
          project_name: trimmedProjectName,
          description: trimmedDescription,
          quantity: quantityNum,
          dimensions: dimensions.trim() || null,
          additional_notes: additionalNotes.trim() || null,
          estimated_completion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks from now
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create customization
      const { error: customizationError } = await supabase
        .from('order_customizations')
        .insert({
          order_id: orderData.id,
          finish: finish as 'matte' | 'glossy' | 'satin',
          texture: texture as 'smooth' | 'textured' | 'hammered',
          color: color === 'custom' ? customColor : color,
          custom_notes: customNotes.trim() || null
        });

      if (customizationError) throw customizationError;

      // Store file references (in real app, would upload to storage first)
      if (uploadedFiles.length > 0) {
        const fileInserts = uploadedFiles.map(file => ({
          order_id: orderData.id,
          file_name: file.name,
          file_size: file.size,
          file_url: `placeholder-${file.name}` // Would be actual storage URL
        }));

        const { error: filesError } = await supabase
          .from('order_files')
          .insert(fileInserts);

        if (filesError) throw filesError;
      }

      toast.success('Order submitted successfully!', {
        description: `Order ${orderNumberData} has been created and is now being processed`
      });
      
      setTimeout(() => {
        navigate('/client/orders');
      }, 1500);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewStyle = () => {
    const selectedColor = colorOptions.find(c => c.value === color);
    return {
      background: color === 'custom' ? customColor : selectedColor?.hex,
      filter: finish === 'matte' ? 'brightness(0.9)' : 'none',
      opacity: finish === 'satin' ? 0.85 : 1
    };
  };

  if (step === 'customize') {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Customize Your Order</h1>
            <p className="text-muted-foreground">Select your preferred finish, texture, and color</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Customization Options */}
            <div className="space-y-6">
              {/* Finish Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Finish Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {finishOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFinish(option.value)}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${finish === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {finish === option.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Texture Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Surface Texture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {textureOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTexture(option.value)}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${texture === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {texture === option.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Color Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Color Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setColor(option.value)}
                        className={`
                          aspect-square rounded-lg border-2 transition-all
                          ${color === option.value 
                            ? 'border-primary ring-4 ring-primary/20' 
                            : 'border-border hover:border-primary/50'}
                        `}
                        style={{ 
                          background: option.hex || 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
                        }}
                      >
                        {color === option.value && (
                          <CheckCircle className="h-6 w-6 mx-auto text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {color === 'custom' && (
                    <div className="space-y-4 pt-2">
                      <Label>Pick Your Custom Color</Label>
                      <div className="flex justify-center">
                        <ColorPickerWheel 
                          value={customColor} 
                          onChange={setCustomColor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Or Enter Hex Code</Label>
                        <Input
                          placeholder="e.g., #FF5733"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                          maxLength={7}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Any special requirements or color matching instructions..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {customNotes.length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    className="aspect-square rounded-lg transition-all duration-300"
                    style={getPreviewStyle()}
                  />

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Finish</span>
                      <Badge variant="secondary">{finishOptions.find(f => f.value === finish)?.label}</Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Texture</span>
                      <Badge variant="secondary">{textureOptions.find(t => t.value === texture)?.label}</Badge>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Color</span>
                      <Badge variant="secondary">
                        {color === 'custom' ? customColor || 'Custom' : colorOptions.find(c => c.value === color)?.label}
                      </Badge>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => setStep('details')}
                  >
                    Continue to Order Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setStep('customize')}
            className="mb-4"
          >
            ← Back to Customization
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Order Details</h1>
          <p className="text-muted-foreground">Provide information about your items</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., Office Building Window Frames"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {projectName.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Item Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the items to be powder coated..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {itemDescription.length}/1000 characters (minimum 10)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 12"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  placeholder="e.g., 2m x 1.5m"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or requirements..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {additionalNotes.length}/1000 characters
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Upload Files (Optional)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Click to upload files</p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, or DWG files (max 10MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.dwg"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Finish</p>
                  <p className="font-medium">{finishOptions.find(f => f.value === finish)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Texture</p>
                  <p className="font-medium">{textureOptions.find(t => t.value === texture)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Color</p>
                  <p className="font-medium">
                    {color === 'custom' ? customColor : colorOptions.find(c => c.value === color)?.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('customize')}
                disabled={isSubmitting}
              >
                Back to Customization
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}