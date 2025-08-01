import { useState, useEffect } from 'react';
import { useUser, useSignIn, useSignUp } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, LogIn, UserPlus, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TurnstileCaptcha } from './TurnstileCaptcha';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const signIn = useSignIn();
  const signUp = useSignUp();
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test connection silently in production
        await supabase.auth.getSession();
        await supabase
          .from('profiles')
          .select('count')
          .limit(1);
      } catch {
        // Connection test failed - will be handled by auth flow
      }
    };
    testConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCaptchaError(null);

    // Check if CAPTCHA is required and verified (bypass in development if CAPTCHA fails)
    const isDevelopment = import.meta.env.DEV;
    if (!captchaToken && !isDevelopment) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    // In development, show warning if CAPTCHA is bypassed
    if (!captchaToken && isDevelopment) {
      console.warn('⚠️ CAPTCHA bypassed in development mode');
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(`Login failed: ${error.message}`);
          // Reset CAPTCHA on error
          setCaptchaToken(null);
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setError(`Sign up failed: ${error.message}`);
          // Reset CAPTCHA on error
          setCaptchaToken(null);
        } else {
          setError('Check your email for the confirmation link!');
        }
      }
    } catch (err) {
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Reset CAPTCHA on error
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setError('');
      }
    } catch {
      setError('Failed to send reset email');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaToken(null);
    setCaptchaError(error);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaError('CAPTCHA expired');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-8 text-primary-foreground">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Welcome to Storefy</h1>
            <p className="text-base text-primary-foreground/90 leading-relaxed">
              Your complete retail management solution. Streamline operations with powerful tools.
            </p>
          </div>
          <div className="space-y-2 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full"></div>
              <span>Inventory Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full"></div>
              <span>Point of Sale System</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full"></div>
              <span>Customer Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full"></div>
              <span>Analytics & Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Storefy</h1>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? 'Welcome back! Please enter your details.'
                : 'Get started with your retail management journey.'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                {isLogin && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="text-xs p-0 h-auto"
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Forgot password?'}
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10 h-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-10 w-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* CAPTCHA Verification */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Security Verification
              </Label>
              <TurnstileCaptcha
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                theme="auto"
                size="normal"
                className="w-full"
              />
              {captchaError && (
                <p className="text-xs text-destructive">{captchaError}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading || !captchaToken}
            >
              {loading ? (
                'Please wait...'
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-3">
            {isLogin && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-background text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                {/* PIN Login for Team Members - Only show in login mode */}
                <Button
                  variant="outline"
                  onClick={() => navigate('/pin-login')}
                  className="w-full h-9 text-sm"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Team Member PIN Login
                </Button>
              </>
            )}

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setShowPassword(false);
                }}
                className="text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}