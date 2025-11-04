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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = () => {
    if (!projectName || !itemDescription || !quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const orderId = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    toast.success('Order submitted successfully!', {
      description: `Order ${orderId} has been created`
    });
    
    setTimeout(() => {
      navigate('/client/orders');
    }, 1500);
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
      <div className="min-h-screen bg-background">
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
                          background: option.hex || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      >
                        {color === option.value && (
                          <CheckCircle className="h-6 w-6 mx-auto text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {color === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Color Code</Label>
                      <Input
                        placeholder="Enter hex code (e.g., #FF5733)"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Any special requirements or color matching instructions..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      rows={3}
                    />
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
    <div className="min-h-screen bg-background">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Item Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the items to be powder coated..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 12 pieces"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
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
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Upload Files (Optional)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Technical drawings, photos, or specifications
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.dwg"
              />

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.name.endsWith('.pdf') ? (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
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

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Selected Customization</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Finish:</span>
                  <span className="ml-2 font-medium">{finishOptions.find(f => f.value === finish)?.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Texture:</span>
                  <span className="ml-2 font-medium">{textureOptions.find(t => t.value === texture)?.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <span className="ml-2 font-medium">
                    {color === 'custom' ? customColor : colorOptions.find(c => c.value === color)?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('customize')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmitOrder}>
                Submit Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
