import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { DeliveryAuthProvider } from '@/context/DeliveryAuthContext';
import { SocketProvider } from '@/context/SocketContext';

export const metadata: Metadata = {
  title: 'FreshCart Delivery Partner Portal',
  description: 'Fast, reliable delivery fulfillment and real-time dispatch system',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <ThemeProvider>
          <DeliveryAuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </DeliveryAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

