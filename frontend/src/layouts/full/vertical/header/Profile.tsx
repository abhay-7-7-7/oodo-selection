// Brightloop User Profile Drawer
import { FC } from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from 'src/components/ui/sheet';
import { Avatar, AvatarFallback } from 'src/components/ui/avatar';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate } from 'react-router';
import {
  Shield,
  UserCog,
  UserCheck,
  Mail,
  LogOut,
  Settings,
  X,
} from 'lucide-react';

export const ProfileSheet: FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Sheet>
      <SheetTrigger className="cursor-pointer hover:bg-secondary flex items-center justify-center rounded-full h-9 w-9 border border-border transition">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
            {user ? getInitials(user.name) : 'BL'}
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>

      <SheetContent showCloseButton={false} side="right" className="w-full sm:max-w-xs p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h5 className="font-semibold text-sm">Account Overview</h5>
            <SheetClose className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </SheetClose>
          </div>

          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md mb-3">
              {user ? getInitials(user.name) : 'BL'}
            </div>
            <h4 className="font-bold text-base text-foreground">{user?.name || 'Brightloop User'}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'admin@brightloop.io'}</span>
            </div>
            <div className="mt-2.5">
              <Badge variant={role === 'admin' ? 'default' : role === 'staff' ? 'secondary' : 'outline'} className="capitalize">
                {role} Account
              </Badge>
            </div>
          </div>

          {/* Quick Demo Role Switching for Judges */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Persona (Hackathon Evaluation)
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => switchRole('admin')}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition ${
                  role === 'admin' ? 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200' : 'hover:bg-secondary border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-semibold">Alex Vance</div>
                    <div className="text-[10px] text-muted-foreground">Admin — Full System Control</div>
                  </div>
                </div>
                {role === 'admin' && <span className="text-[10px] font-bold text-blue-600">Active</span>}
              </button>

              <button
                onClick={() => switchRole('staff')}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition ${
                  role === 'staff' ? 'bg-teal-50 border-teal-300 text-teal-900 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-200' : 'hover:bg-secondary border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="font-semibold">Sarah Jenkins</div>
                    <div className="text-[10px] text-muted-foreground">Internal Staff — Operations</div>
                  </div>
                </div>
                {role === 'staff' && <span className="text-[10px] font-bold text-teal-600">Active</span>}
              </button>

              <button
                onClick={() => switchRole('customer')}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition ${
                  role === 'customer' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200' : 'hover:bg-secondary border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-semibold">Ravi Patel</div>
                    <div className="text-[10px] text-muted-foreground">Customer Portal (TechCorp)</div>
                  </div>
                </div>
                {role === 'customer' && <span className="text-[10px] font-bold text-indigo-600">Active</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-4 h-4" />
            System Settings
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start gap-2 text-xs cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
