import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/customer/Navbar';
import Footer from '@/components/customer/Footer';
import CartDrawer from '@/components/customer/CartDrawer';

export const metadata: Metadata = {
  title: 'FreshCart Supermarket | Online Fresh Grocery Ordering',
  description: 'Farm-fresh fruits, vegetables, daily dairy, staples, snacks delivered to your doorstep in 2 hours with Cash on Delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
