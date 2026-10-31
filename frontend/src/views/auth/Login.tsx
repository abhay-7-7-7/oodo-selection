// Brightloop Login View
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Checkbox } from 'src/components/ui/checkbox';
import { AlertCircle, Eye, EyeOff, Shield, UserCog, UserCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const Login: React.FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'customer') {
        navigate('/portal');
      } else {
        navigate(from === '/auth/login' ? '/' : from);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (role: 'admin' | 'staff' | 'customer') => {
    switchRole(role);
    if (role === 'customer') {
      setEmail('ravi@techcorp.in');
      toast.success('Switched to Customer persona (Ravi Patel)');
      navigate('/portal');
    } else if (role === 'staff') {
      setEmail('sarah@brightloop.io');
      toast.success('Switched to Staff persona (Sarah Jenkins)');
      navigate('/');
    } else {
      setEmail('admin@brightloop.io');
      toast.success('Switched to Admin persona (Alex Vance)');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <FullLogo className="scale-110 mb-6" />
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Software Subscription Management and Recurring Billing Cloud
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-sm border border-border rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold">
                Email address
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="text-xs h-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={checked => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer font-normal">
                  Remember this device
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full text-xs h-9 font-semibold gap-1.5 cursor-pointer">
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          {/* Quick 1-Click Persona Login for Hackathon Evaluators */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
              One-Click Judge / Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLoginAs('admin')}
                className="text-[11px] h-8 px-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-blue-600" />
                <span>Admin</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLoginAs('staff')}
                className="text-[11px] h-8 px-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserCog className="w-3 h-3 text-teal-600" />
                <span>Staff</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLoginAs('customer')}
                className="text-[11px] h-8 px-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3 h-3 text-indigo-600" />
                <span>Customer</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-500">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
