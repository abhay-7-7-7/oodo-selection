// Brightloop Customer Portal Layout
// Clean, professional, simplified client-facing workspace strictly scoped to customer's own data

import { FC } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import FullLogo from '../full/shared/logo/FullLogo';
import LightDark from '../full/vertical/header/Light-Dark';
import Footer from '../full/shared/footer/Footer';
import {
  BarChart3,
  Repeat,
  FileText,
  CreditCard,
  Building2,
  Shield,
  UserCog,
  UserCheck,
  ChevronDown,
  Check,
  LogOut,
} from 'lucide-react';
import { Badge } from 'src/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { UserRole } from 'src/types';

export const PortalLayout: FC = () => {
  const { role, switchRole, user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'My Dashboard', to: '/portal', icon: BarChart3, exact: true },
    { name: 'Subscriptions', to: '/portal/subscriptions', icon: Repeat },
    { name: 'Invoices', to: '/portal/invoices', icon: FileText },
    { name: 'Payment History', to: '/portal/payments', icon: CreditCard },
    { name: 'Company Profile', to: '/portal/profile', icon: Building2 },
  ];

  const roles: Array<{ id: UserRole; name: string; title: string; icon: typeof Shield }> = [
    { id: 'admin', name: 'Alex Vance', title: 'Admin (Full System)', icon: Shield },
    { id: 'staff', name: 'Sarah Jenkins', title: 'Internal Staff', icon: UserCog },
    { id: 'customer', name: 'Ravi Patel', title: 'Customer (TechCorp)', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Portal Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xs border-b border-border shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <FullLogo />

              {/* Customer Portal Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const isActive = link.exact
                    ? location.pathname === link.to
                    : location.pathname.startsWith(link.to);

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Persona Switcher for Hackathon Evaluation */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-background hover:bg-secondary text-xs font-medium cursor-pointer transition shadow-2xs outline-none">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-foreground hidden sm:inline">{user?.name || 'Ravi Patel'}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold text-indigo-600 border-indigo-300">
                    Customer
                  </Badge>
                  <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Switch Active Persona
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {roles.map(r => {
                    const ItemIcon = r.icon;
                    const isCurrent = role === r.id;
                    return (
                      <DropdownMenuItem
                        key={r.id}
                        onClick={() => switchRole(r.id)}
                        className="flex items-center justify-between text-xs py-2 px-2 cursor-pointer rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          <div>
                            <div className="font-semibold text-foreground">{r.name}</div>
                            <div className="text-[10px] text-muted-foreground">{r.title}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <LightDark />

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-border px-4 py-2 flex items-center justify-around overflow-x-auto">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ${
                  isActive ? 'text-blue-600 font-bold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6">
        <Footer />
      </div>
    </div>
  );
};

export default PortalLayout;
