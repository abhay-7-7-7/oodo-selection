import React from 'react';
import NavCollapse from './nav-collapse';
import SimpleBar from 'simplebar-react';
import FullLogo from '../../shared/logo/FullLogo';
import { useAuth } from 'src/context/AuthContext';
import { getSidebarItems } from './sidebaritems';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from 'src/components/ui/sidebar';
import { NavSecondary } from './NavSecondary';
import { NavUser } from './NavUser';
import { Badge } from 'src/components/ui/badge';

const SidebarLayout = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { role } = useAuth();
  const menuItems = getSidebarItems(role);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      className="sidebar-box **:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:border-border group-data-[state=collapsed]:hover:shadow-xl"
      side="left"
    >
      <SidebarHeader className="p-3 group-data-[state=collapsed]:px-2.5 flex flex-row items-center justify-between border-b border-border">
        <FullLogo />
        <Badge className="group-data-[state=collapsed]:hidden text-[10px] font-semibold" variant="secondary">
          v1.0
        </Badge>
      </SidebarHeader>

      <SidebarContent>
        <SimpleBar style={{ height: '100%' }}>
          <SidebarGroup className="flex items-center justify-center group-data-[state=collapsed]:px-2 px-3 py-4">
            <div className="px-0 group-data-[state=collapsed]:px-0 w-full flex flex-col gap-4">
              <NavCollapse menu={menuItems} className="text-sm" />
            </div>
          </SidebarGroup>
        </SimpleBar>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border flex flex-col gap-2">
        <div className="hide-menu flex flex-col gap-2">
          <NavSecondary />
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarLayout;
