import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';

export function Settings() {
  const location = useLocation();

  const isProfileActive = location.pathname === '/settings' || location.pathname === '/settings/profile';
  const isUsersActive = location.pathname === '/settings/users';
  const isQueueActive = location.pathname === '/settings/queue';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Settings"
        subtitle="Manage your system settings and preferences"
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto bg-white border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <NavLink
                to="/settings/profile"
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isProfileActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Profile
              </NavLink>
              <NavLink
                to="/settings/users"
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isUsersActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </NavLink>
              <NavLink
                to="/settings/queue"
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isQueueActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Queue Management
              </NavLink>
            </nav>
          </div>

          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
