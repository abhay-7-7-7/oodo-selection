// Brightloop Top Navigation Header
import { FC } from 'react';
import { useSidebar } from 'src/components/ui/sidebar';
import { Button } from 'src/components/ui/button';
import { PanelLeft, Shield, UserCog, UserCheck, ChevronDown, Check, Home } from 'lucide-react';
import { Separator } from 'src/components/ui/separator';
import { Badge } from 'src/components/ui/badge';
import { useAuth } from 'src/context/AuthContext';
import { UserRole } from 'src/types';
import { Link, useLocation } from 'react-router';
import FullLogo from '../../shared/logo/FullLogo';
import Profile from './Profile';
import LightDark from './Light-Dark';
import Notifications from './Notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

export const Header: FC = () => {
  const { toggleSidebar } = useSidebar();
  const { role, switchRole } = useAuth();
  const location = useLocation();

  const roles: Array<{ id: UserRole; name: string; title: string; icon: typeof Shield }> = [
    { id: 'admin', name: 'Alex Vance', title: 'Admin (Full System)', icon: Shield },
    { id: 'staff', name: 'Sarah Jenkins', title: 'Internal Staff', icon: UserCog },
    { id: 'customer', name: 'Ravi Patel', title: 'Customer (TechCorp)', icon: UserCheck },
  ];

  const currentRoleConfig = roles.find(r => r.id === role) || roles[0];
  const CurrentIcon = currentRoleConfig.icon;

  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p === '/' || p === '/dashboard') return 'Dashboard';
    if (p.startsWith('/customers/')) return 'Customer Details';
    if (p === '/customers') return 'Customers';
    if (p === '/catalog/products' || p === '/products') return 'Catalog / Products';
    if (p === '/catalog/variants' || p === '/product-variants') return 'Catalog / Product Variants';
    if (p === '/catalog/plans' || p === '/subscription-plans') return 'Catalog / Subscription Plans';
    if (p === '/catalog/taxes' || p === '/taxes') return 'Catalog / Taxes';
    if (p === '/catalog/discounts' || p === '/discounts') return 'Catalog / Discounts';
    if (p === '/quotations') return 'Quotations';
    if (p.startsWith('/subscriptions/')) return 'Subscription Details';
    if (p === '/subscriptions') return 'Subscriptions';
    if (p === '/billing-runs') return 'Billing Runs';
    if (p === '/invoices') return 'Invoices';
    if (p === '/payments') return 'Payments';
    if (p === '/reports') return 'Finance Reports';
    if (p === '/notifications') return 'Notification Centre';
    if (p === '/admin/staff' || p === '/staff') return 'Administration / User Management';
    if (p === '/settings') return 'Administration / Settings';
    if (p === '/profile') return 'My Profile';
    return p.slice(1).split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' / ');
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xs border-b border-border">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        {/* Left Side: Logo, Toggle, Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="block lg:hidden">
            <FullLogo />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="p-1.5 hover:bg-secondary rounded-lg transition cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleSidebar}
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1 hidden sm:block bg-border" />

          {/* Breadcrumb Navigation */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 truncate">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground truncate">
              {getBreadcrumbTitle()}
            </span>
          </nav>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Persona / Role Quick Switcher Pill (Critical for Hackathon Evaluation) */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-card hover:bg-secondary text-xs font-medium cursor-pointer transition shadow-2xs outline-none">
                <CurrentIcon className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-foreground hidden md:inline">{currentRoleConfig.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider">
                  {role}
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
          </div>

          {/* Theme Toggle (Light/Dark) */}
          <LightDark />

          {/* Notifications */}
          <Notifications />

          {/* Profile Drawer */}
          <Profile />
        </div>
      </div>
    </header>
  );
};

export default Header;
