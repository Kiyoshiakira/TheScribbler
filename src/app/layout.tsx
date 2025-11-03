
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CurrentScriptProvider } from '@/context/current-script-context';
import { SettingsProvider } from '@/context/settings-context';
import { FindReplaceProvider } from '@/hooks/use-find-replace';

export const metadata: Metadata = {
  title: 'ScriptScribbler',
  description: 'Collaborative screenwriting with AI-powered tools.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <FirebaseClientProvider>
          <SettingsProvider>
            <CurrentScriptProvider>
                {children}
                <Toaster />
            </CurrentScriptProvider>
          </SettingsProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
