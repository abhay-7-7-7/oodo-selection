// Brightloop Sign Up View
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Check, X, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password validation rules as required by Hackathon brief
  const hasMinLength = password.length >= 9; // 'more than eight characters'
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar && passwordsMatch && email.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Please satisfy all password complexity and confirmation requirements.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.signup({
        name,
        email,
        password,
      });

      toast.success('Account successfully created! You can now sign in.');
      navigate('/auth/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <FullLogo className="scale-110 mb-6" />
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
          Create customer account
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Join Brightloop Software Subscription Cloud
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
              <Label htmlFor="name" className="text-xs font-semibold">
                Full Name
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ravi Patel"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-semibold">
                Work Email address
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ravi@techcorp.in"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-semibold">
                Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 9 characters"
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

            <div>
              <Label htmlFor="confirm-password" className="text-xs font-semibold">
                Confirm Password
              </Label>
              <div className="mt-1">
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Live Password Rules Checklist (Handoff Rubric Requirement) */}
            <div className="p-3 rounded-lg bg-secondary/60 border border-border space-y-1.5 text-[11px]">
              <span className="font-semibold text-foreground block mb-1">
                Password Requirements:
              </span>
              <div className="flex items-center gap-1.5">
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                  At least 9 characters (&gt; 8 characters)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasUpperCase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={hasUpperCase ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                  At least one uppercase letter (A-Z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasLowerCase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={hasLowerCase ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                  At least one lowercase letter (a-z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={hasSpecialChar ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                  At least one special character (!@#$%^&*)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={passwordsMatch ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                  Passwords match
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full text-xs h-9 font-semibold gap-1.5 cursor-pointer mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Customer Account'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
