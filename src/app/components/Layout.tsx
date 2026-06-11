import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Backdrop overlay - Only on small screens when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black bg-opacity-40 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 w-full min-w-0 transition-all duration-300 ${sidebarOpen ? 'sm:ml-64' : 'sm:ml-16'}`}>
        <Outlet />
      </main>
    </div>
  );
}
