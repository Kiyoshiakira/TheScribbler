
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CurrentScriptProvider } from '@/context/current-script-context';
import { PlanProvider } from '@/context/plan-context';
import { SettingsProvider } from '@/context/settings-context';
import { ThemeProvider } from '@/context/theme-provider';
import { ToolProvider } from '@/context/tool-context';
import { ServiceWorkerInitializer } from '@/components/ServiceWorkerInitializer';

export const metadata: Metadata = {
  title: 'The Scribbler',
  description: 'Collaborative writing with AI-powered tools.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <FirebaseClientProvider>
          <PlanProvider>
            <SettingsProvider>
              <ThemeProvider>
                <ToolProvider>
                  <CurrentScriptProvider>
                    <ServiceWorkerInitializer />
                    {children}
                    <Toaster />
                  </CurrentScriptProvider>
                </ToolProvider>
              </ThemeProvider>
            </SettingsProvider>
          </PlanProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
