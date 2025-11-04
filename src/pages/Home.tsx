import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Palette, Users, Award, CheckCircle, Zap, Clock } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Premium Quality',
      description: 'Industrial-grade powder coating with long-lasting durability and protection',
    },
    {
      icon: Palette,
      title: 'Custom Finishes',
      description: 'Wide range of colors, textures, and finishes to match your exact specifications',
    },
    {
      icon: Clock,
      title: 'Fast Turnaround',
      description: 'Quick processing and delivery without compromising on quality',
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Experienced professionals dedicated to delivering excellence',
    },
  ];

  const benefits = [
    'Superior corrosion resistance',
    'Environmentally friendly process',
    'Cost-effective solution',
    'Beautiful, uniform finish',
    'Excellent adhesion',
    'Wide color selection',
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Top Powdercoating Corp</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="hero" onClick={() => navigate('/login')}>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-6">
            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-1.5">
              <Award className="w-4 h-4 mr-2" />
              Trusted by 500+ Industrial Clients
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Professional Powder Coating
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your metal surfaces with our premium powder coating services. 
              Custom finishes, fast turnaround, and exceptional quality guaranteed.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="hero" size="lg" onClick={() => navigate('/login')}>
                Start Your Order
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                View Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground">Excellence in every coating application</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Superior Powder Coating Benefits
              </h2>
              <p className="text-muted-foreground mb-8">
                Our advanced powder coating process delivers unmatched protection and aesthetics 
                for your metal components. From automotive parts to industrial equipment, we've got you covered.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-primary opacity-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-5xl font-bold text-primary mb-2">15+</div>
                  <div className="text-lg text-muted-foreground">Years of Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust us with their powder coating needs. 
            Get a quote in minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="accent" 
              size="lg"
              onClick={() => navigate('/login')}
              className="shadow-xl"
            >
              Create Your Order
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Top Powdercoating Corp</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Top Powdercoating Corp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
