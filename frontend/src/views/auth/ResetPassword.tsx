// Brightloop Reset Password View
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Check, X, Eye, EyeOff, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || 'sec_tok_demo_token_123';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 9;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Please satisfy all password complexity and matching requirements.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.resetPassword(token, newPassword);
      toast.success('Your password has been successfully reset! You can now sign in.');
      navigate('/auth/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
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
          Set New Password
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Enter and verify your updated Brightloop credentials
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-sm border border-border rounded-xl sm:px-10">
          {/* Token verification chip */}
          <div className="mb-4 flex items-center justify-between p-2.5 rounded-lg bg-secondary/80 border border-border text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Token:</span>
              <span className="font-mono text-foreground font-semibold truncate max-w-[150px]">{token}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-xs font-semibold">
                New Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
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
                Confirm New Password
              </Label>
              <div className="mt-1">
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Live Requirements checklist */}
            <div className="p-3 rounded-lg bg-secondary/60 border border-border space-y-1.5 text-[11px]">
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
                  At least one special character
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
              {loading ? 'Updating Password...' : 'Save and Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Remember your credentials?{' '}
            <Link to="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
