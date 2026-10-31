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
  const isCollapse = state === 'collapsed';

  return (
    <div className="flex flex-col gap-1 w-full">
      {menu.map((item, index) => {
        // If it's a section heading
        if (item.heading) {
          return (
            <div key={`heading-${index}`} className="pt-3 pb-1 first:pt-0">
              <span
                className={cn(
                  'text-[10px] uppercase block font-bold tracking-wider text-muted-foreground/80 px-2 transition-all duration-200',
                  isCollapse ? 'text-center group-hover:text-start group-data-[state=expanded]:text-start' : ''
                )}
              >
                {isCollapse ? (
                  <>
                    <span className="group-hover:hidden group-data-[state=expanded]:hidden">•••</span>
                    <span className="hidden group-hover:inline group-data-[state=expanded]:inline">
                      {item.heading}
                    </span>
                  </>
                ) : (
                  item.heading
                )}
              </span>
            </div>
          );
        }

        // Direct Navigation Item
        const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to || '###'));
        const Icon = item.icon;

        return (
          <Link
            key={item.id || index}
            to={item.to || '#'}
            className={cn(
              'group/item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
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

            <span className="truncate flex-1 hide-menu">{item.name}</span>

            {/* Badges for Novelty Features (N1, N2, N3, etc.) */}
            {item.badge && item.badgeContent && (
              <span
                className={cn(
                  'hide-menu px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider',
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
          </Link>
        );
      })}
    </div>
  );
}
