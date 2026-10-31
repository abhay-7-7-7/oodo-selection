import { FC } from 'react';
import { Link } from 'react-router';
import { useAuth } from 'src/context/AuthContext';

interface FullLogoProps {
  className?: string;
}

const FullLogo: FC<FullLogoProps> = ({ className = '' }) => {
  const { isCustomer } = useAuth();
  const targetPath = isCustomer ? '/portal' : '/';

  return (
    <Link to={targetPath} className={`flex items-center gap-2.5 group transition-opacity hover:opacity-90 ${className}`}>
      {/* Brightloop Infinity Loop Mark */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 shadow-sm shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
        >
          <path
            d="M18.178 8c1.78 0 3.322 1.542 3.322 3.5 0 2.21-1.79 4-4 4-1.381 0-2.613-.701-3.344-1.767l-4.312-6.466C9.113 6.201 7.881 5.5 6.5 5.5 4.29 5.5 2.5 7.29 2.5 9.5c0 1.958 1.542 3.5 3.322 3.5 1.381 0 2.613-.701 3.344-1.767l1.042-1.562"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.822 16c-1.78 0-3.322-1.542-3.322-3.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col select-none leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-lg tracking-tight text-foreground">
            Bright<span className="text-blue-600">loop</span>
          </span>
          {isCustomer && (
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Portal
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground tracking-tight mt-0.5">
          Subscription Cloud
        </span>
      </div>
    </Link>
  );
};

export default FullLogo;
