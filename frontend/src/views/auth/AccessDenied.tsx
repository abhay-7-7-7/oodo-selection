// Brightloop 403 Access Denied View
import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { Button } from 'src/components/ui/button';
import { ShieldAlert, Shield, ArrowLeft } from 'lucide-react';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const AccessDenied: React.FC = () => {
  const { role, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleElevateToAdmin = () => {
    switchRole('admin');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <FullLogo className="scale-110 mb-6" />
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-10 px-6 shadow-sm border border-border rounded-xl sm:px-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              403 — Access Restricted
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are currently signed in with the <span className="font-semibold text-foreground capitalize">[{role}]</span> role. This administrative module requires elevated privileges.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/80 border border-border text-left text-xs space-y-1">
            <span className="font-semibold text-foreground">Role Policy Enforcement:</span>
            <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5">
              <li>Customer role: Restricted strictly to customer portal</li>
              <li>Staff role: Day-to-day operations; cannot create staff or discounts</li>
              <li>Admin role: Full authority over catalog, staff, pricing, and system</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleElevateToAdmin}
              className="w-full text-xs h-9 font-semibold gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Shield className="w-3.5 h-3.5" />
              Switch to Admin Persona (Alex Vance)
            </Button>

            <Link to={role === 'customer' ? '/portal' : '/'}>
              <Button variant="outline" className="w-full text-xs h-9 gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Permitted Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
