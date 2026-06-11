import { NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  FileText,
  Package,
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  ListOrdered,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useHasPermission } from "../../hooks/usePermissions";
import { logout } from "../../store/slices/authSlice";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const userInitial =
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleNavClick = () => {
    // Close sidebar on mobile devices only (when it's in overlay mode)
    if (window.innerWidth < 640) {
      onClose();
    }
  };

  // Evaluate permissions once to avoid redundant selector calls and add debug
  const canViewDashboard = useHasPermission("dashboard", "view");
  const canViewPatientRegistry = useHasPermission("patientRegistry", "view");
  const canViewFPE = useHasPermission("fpe", "view");
  const canViewInventory = useHasPermission("inventory", "viewInventory");
  const canViewActivityLog = useHasPermission("activityLog", "view");
  const canViewPatientSurveys = useHasPermission("patientSurveys", "view");
  const canViewPatientFlow = useHasPermission("patientFlowMetrics", "view");
  const canViewQueue = useHasPermission("queueManagement", "view");
  const canViewSettings = useHasPermission("settings", "view");

  // Debug current rendered permission decisions (temporary)
  // eslint-disable-next-line no-console
  console.debug("Sidebar: permission summary", {
    user: user?.id || user?.email,
    canViewDashboard,
    canViewPatientRegistry,
    canViewFPE,
    canViewInventory,
    canViewActivityLog,
    canViewPatientSurveys,
    canViewPatientFlow,
    canViewQueue,
    canViewSettings,
    permissions: user?.permissions,
  });

  return (
    <>
      <aside
        className={`${isOpen ? "w-64" : "w-16"} bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out shadow-lg`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH_Logo-removebg-preview.png?alt=media&token=de7727c9-19c4-4d92-acf9-f4f8cbc51ab6"
              alt="DDH Logo"
              className={`object-contain flex-shrink-0 transition-all duration-300 ${isOpen ? "w-12 h-12" : "w-8 h-8"}`}
            />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-gray-900 leading-tight">
                  Dupax District Hospital
                </h1>
                <p className="text-xs text-gray-500">Yakap System</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {canViewDashboard && (
              <NavLink
                to="/"
                end
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Dashboard" : ""}
              >
                <LayoutDashboard size={20} className="flex-shrink-0" />
                {isOpen && <span>Dashboard</span>}
              </NavLink>
            )}

            {canViewPatientRegistry && (
              <NavLink
                to="/patients"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Patient Registry" : ""}
              >
                <Users size={20} className="flex-shrink-0" />
                {isOpen && <span>Patient Registry</span>}
              </NavLink>
            )}

            {canViewFPE && (
              <NavLink
                to="/fpe"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "First Patient Encounter" : ""}
              >
                <FileText size={20} className="flex-shrink-0" />
                {isOpen && <span>First Patient Encounter</span>}
              </NavLink>
            )}

            {canViewInventory && (
              <NavLink
                to="/inventory"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Inventory" : ""}
              >
                <Package size={20} className="flex-shrink-0" />
                {isOpen && <span>Inventory</span>}
              </NavLink>
            )}

            {canViewActivityLog && (
              <NavLink
                to="/activity-log"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Activity Log" : ""}
              >
                <Activity size={20} className="flex-shrink-0" />
                {isOpen && <span>Activity Log</span>}
              </NavLink>
            )}

            {canViewPatientSurveys && (
              <NavLink
                to="/surveys"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Patient Surveys" : ""}
              >
                <ClipboardList size={20} className="flex-shrink-0" />
                {isOpen && <span>Patient Surveys</span>}
              </NavLink>
            )}

            {canViewPatientFlow && (
              <NavLink
                to="/patient-flow"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Patient Flow Metrics" : ""}
              >
                <TrendingUp size={20} className="flex-shrink-0" />
                {isOpen && <span>Patient Flow Metrics</span>}
              </NavLink>
            )}

            {canViewQueue && (
              <NavLink
                to="/queue"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Queue Management" : ""}
              >
                <ListOrdered size={20} className="flex-shrink-0" />
                {isOpen && <span>Queue Management</span>}
              </NavLink>
            )}

            {canViewSettings && (
              <NavLink
                to="/settings"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 text-base transition-colors duration-150 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${!isOpen && "justify-center"}`
                }
                title={!isOpen ? "Settings" : ""}
              >
                <Settings size={20} className="flex-shrink-0" />
                {isOpen && <span>Settings</span>}
              </NavLink>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div
            className={`flex items-center gap-3 py-3 mb-2 ${isOpen ? "px-4" : "px-0 justify-center"}`}
          >
            <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-base font-medium rounded-full flex-shrink-0">
              {userInitial}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 py-3 text-base text-gray-700 hover:bg-gray-50 w-full transition-colors rounded-md ${isOpen ? "px-4" : "px-0 justify-center"}`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button - always visible at sidebar edge */}
      <button
        onClick={onClose}
        className={`fixed top-1/2 -translate-y-1/2 z-50 w-7 h-20 bg-gray-600 hover:bg-gray-700 text-white rounded-r-lg shadow-lg transition-all duration-300 flex items-center justify-center group ${
          isOpen ? "left-64" : "left-0"
        }`}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        title={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
        ) : (
          <ChevronRight
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
        )}
      </button>
    </>
  );
}
