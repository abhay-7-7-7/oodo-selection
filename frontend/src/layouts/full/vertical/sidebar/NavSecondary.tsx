// Brightloop Role Switcher & System Environment Widget
import { FC } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { UserRole } from 'src/types';
import { ShieldCheck, UserCog, UserCheck, Shield } from 'lucide-react';
import { Badge } from 'src/components/ui/badge';

export const NavSecondary: FC = () => {
  const { role, switchRole } = useAuth();

  const roles: Array<{ id: UserRole; label: string; icon: typeof ShieldCheck; color: string }> = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-blue-600' },
    { id: 'staff', label: 'Staff', icon: UserCog, color: 'text-teal-600' },
    { id: 'customer', label: 'Customer', icon: UserCheck, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-2.5 rounded-lg border border-border bg-card/60 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Active Demo Role</span>
        <Badge variant={role === 'admin' ? 'default' : role === 'staff' ? 'secondary' : 'outline'} className="text-[10px] h-4 px-1.5 capitalize font-bold">
          {role}
        </Badge>
      </div>

      {/* Quick 1-click Role Switcher for Hackathon Evaluation */}
      <div className="grid grid-cols-3 gap-1 bg-secondary/70 p-0.5 rounded-md">
        {roles.map(r => {
          const isActive = role === r.id;
          const IconComponent = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => switchRole(r.id)}
              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={`Switch role to ${r.label}`}
            >
              <IconComponent className={`w-3 h-3 ${isActive ? r.color : ''}`} />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavSecondary;
