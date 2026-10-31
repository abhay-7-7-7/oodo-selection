// Brightloop 404 Not Found View
import React from 'react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <FullLogo className="scale-110 mb-6" />
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-10 px-6 shadow-sm border border-border rounded-xl sm:px-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              404 — Page Not Found
            </h2>
            <p className="text-xs text-muted-foreground">
              The requested subscription module or endpoint does not exist.
            </p>
          </div>

          <Link to="/" className="block pt-2">
            <Button className="w-full text-xs h-9 gap-1.5 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
