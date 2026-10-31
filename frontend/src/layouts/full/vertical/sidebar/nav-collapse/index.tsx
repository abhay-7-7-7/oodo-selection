import { Link, useLocation } from 'react-router';
import { cn } from 'src/lib/utils';
import { useSidebar } from 'src/components/ui/sidebar';
import { MenuItem } from '../sidebaritems';

interface NavCollapseProps {
  menu: MenuItem[];
  className?: string;
}

export default function NavCollapse({ menu, className }: NavCollapseProps) {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="flex flex-col gap-1 w-full">
      {menu.map((item, index) => {
        // Section Heading
        if (item.heading) {
          return (
            <div key={`heading-${index}`} className="pt-3 pb-1 first:pt-1 px-2">
              <span
                className={cn(
                  'text-[10px] uppercase block font-bold tracking-wider text-muted-foreground/70 transition-all',
                  isCollapsed ? 'text-center' : ''
                )}
              >
                {isCollapsed ? '•••' : item.heading}
              </span>
            </div>
          );
        }

        // Direct Navigation Item
        const isActive =
          pathname === item.to ||
          (item.to && item.to !== '/' && item.to !== '/dashboard' && pathname.startsWith(item.to));
        const Icon = item.icon;

        return (
          <Link
            key={item.id || item.to || index}
            to={item.to || '#'}
            title={item.name}
            className={cn(
              'group/item flex items-center rounded-lg text-xs font-medium transition-all duration-150',
              isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2',
              isActive
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-foreground/80 hover:bg-secondary hover:text-foreground',
              className
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform duration-150 group-hover/item:scale-110',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover/item:text-foreground'
                )}
              />
            )}

            {!isCollapsed && (
              <>
                <span className="truncate flex-1 font-medium">{item.name}</span>
                {item.badge && item.badgeContent && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider',
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeType === 'teal'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    )}
                  >
                    {item.badgeContent}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
