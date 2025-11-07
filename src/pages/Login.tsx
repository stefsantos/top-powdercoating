import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(isAdminMode ? '/admin/dashboard' : '/client/dashboard');
      }
    });
  }, [navigate, isAdminMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success('Welcome back! You have successfully logged in.');
        navigate(isAdminMode ? '/admin/dashboard' : '/client/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Back to Landing Button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-primary-foreground hover:bg-primary-foreground/10"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isAdminMode ? 'Admin Login' : 'Welcome Back'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdminMode
              ? 'Access your admin dashboard'
              : 'Sign in to manage your orders'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} variant="hero">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/signup')}
            >
              Create New Account
            </Button>

            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setIsAdminMode(!isAdminMode)}
            >
              <Shield className="w-4 h-4 mr-2" />
              {isAdminMode ? 'Switch to Client Login' : 'Admin Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
