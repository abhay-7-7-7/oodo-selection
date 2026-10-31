// Brightloop User Profile in Sidebar Footer
import { FC } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export const NavUser: FC = () => {
  const { user, logout } = useAuth();
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
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          {user ? getInitials(user.name) : 'BL'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">
            {user?.name || 'Brightloop User'}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {user?.email || 'admin@brightloop.io'}
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        title="Sign Out"
        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NavUser;
