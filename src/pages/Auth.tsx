import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'reset') {
        setLoading(true);
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent!');
        setMode('login');
        setLoading(false);
        return;
      }

      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setLoading(true);

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : 'Something went wrong. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-2xl">PM</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Personal Manager</h1>
          <p className="text-muted-foreground mt-1">Your secure digital life manager</p>
        </div>

        <Card variant="elevated">
          <CardHeader className="text-center pb-4">
            <CardTitle>
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Sign in to access your personal manager' 
                : mode === 'signup'
                ? 'Start securing your digital life'
                : 'Enter your email to reset your password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'reset' ? (
                <button
                  onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
