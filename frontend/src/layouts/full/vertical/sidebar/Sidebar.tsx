import React from 'react';
import NavCollapse from './nav-collapse';
import FullLogo from '../../shared/logo/FullLogo';
import { useAuth } from 'src/context/AuthContext';
import { getSidebarItems } from './sidebaritems';
import { NavSecondary } from './NavSecondary';
import { NavUser } from './NavUser';
import { Badge } from 'src/components/ui/badge';
import { useSidebar } from 'src/components/ui/sidebar';
import { Sheet, SheetContent } from 'src/components/ui/sheet';
import { cn } from 'src/lib/utils';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from 'src/components/ui/button';

export const SidebarLayout: React.FC = () => {
  const { role } = useAuth();
  const { state, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const menuItems = getSidebarItems(role);

  const sidebarBody = (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* Brand & Toggle Header */}
      <div
        className={cn(
          "h-14 border-b border-border flex items-center shrink-0 px-3 transition-all",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FullLogo />
          {!isCollapsed && (
            <Badge className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5" variant="secondary">
              v1.0
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        <NavCollapse menu={menuItems} />
      </div>

      {/* Footer Controls: Quick Persona Switcher + Profile */}
      <div className="p-3 border-t border-border shrink-0 flex flex-col gap-2.5 bg-card">
        {!isCollapsed && <NavSecondary />}
        <NavUser />
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Left Sidebar: GUARANTEED VISIBLE on all screens and viewports */}
      <aside
        className={cn(
          "h-screen sticky top-0 shrink-0 transition-all duration-200 ease-in-out z-30 flex flex-col bg-card",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarBody}
      </aside>

      {/* Optional Mobile Overlay Drawer for very small screens */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border [&>button]:hidden">
          {sidebarBody}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SidebarLayout;
