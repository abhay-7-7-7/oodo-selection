import { FC } from 'react';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { SidebarProvider } from 'src/components/ui/sidebar';
import Footer from './shared/footer/Footer';
import { Outlet } from 'react-router';

const FullLayout: FC = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground antialiased">
        {/* Desktop & Mobile Responsive Sidebar */}
        <Sidebar />

        {/* Main Content Workspace */}
        <div className="flex flex-1 flex-col min-w-0 min-h-screen bg-background">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
            <div className="max-w-7xl mx-auto w-full pt-8 pb-4">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FullLayout;
