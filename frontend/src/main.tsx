import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/css/globals.css';
import App from './App.tsx';
import Spinner from './views/spinner/Spinner.tsx';
import { ThemeProvider } from './context/shadcntheme/ThemeContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="light" storageKey="brightloop-theme">
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <App />
        <Toaster richColors position="top-right" closeButton />
      </Suspense>
    </AuthProvider>
  </ThemeProvider>,
);
