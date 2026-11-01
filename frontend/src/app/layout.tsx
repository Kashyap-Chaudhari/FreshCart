import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { SocketProvider } from '@/context/SocketContext';
import Navbar from '@/components/customer/Navbar';
import Footer from '@/components/customer/Footer';
import CartDrawer from '@/components/customer/CartDrawer';
import MobileBottomNav from '@/components/customer/MobileBottomNav';

export const metadata: Metadata = {
  title: 'FreshCart Supermarket | 10-15 Mins Fresh Grocery Delivery',
  description: 'Farm-fresh fruits, vegetables, daily dairy, staples, snacks delivered in 10-15 minutes across Gujarat with Cash on Delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-brand-secondary text-brand-text dark:bg-slate-950 dark:text-slate-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <Navbar />
                <main className="flex-1 pb-20 md:pb-8">{children}</main>
                <Footer />
                <CartDrawer />
                <MobileBottomNav />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
