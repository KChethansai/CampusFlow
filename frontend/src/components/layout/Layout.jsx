// Layout: page shell — header, centered content area, toast host.
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';

function Layout() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </div>
  );
}

export default Layout;
