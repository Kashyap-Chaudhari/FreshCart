import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SocketProvider } from '@/context/SocketContext';

export const metadata: Metadata = {
  title: 'FreshCart Admin Portal | Store Operations & Inventory',
  description: 'Manage store orders, products catalog, stock adjustments, customer accounts and sales analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
