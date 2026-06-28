import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, FilePlus, Search, User, LogOut, Menu, X, BarChart3, Bell, BellOff, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotificationBell from "./NotificationBell";

function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/officer") return "Officer Command Center";
    if (path.startsWith("/officer/cases")) return "Assigned Investigations";
    if (path.startsWith("/officer/case/")) return "Case Incident File";
    if (path.startsWith("/officer/investigation")) return "Case Investigations";
    if (path.startsWith("/officer/reports")) return "Caseload Reports";
    if (path.startsWith("/officer/track-status")) return "Track Case Status";
    if (path.startsWith("/dashboard")) return "User Dashboard";
    if (path.startsWith("/admin-dashboard")) return "Admin Control Center";
    if (path.startsWith("/admin/users")) return "Users Management";
    if (path.startsWith("/admin/officers")) return "Officers Management";
    if (path.startsWith("/complaint")) return "File New Complaint";
    if (path.startsWith("/track-complaint")) return "Track Complaint Status";
    if (path.startsWith("/profile")) return "Account Settings";
    return "Cyber Portal";
  };

  const getPageDescription = () => {
    const path = location.pathname;
    if (path === "/officer") return "Assigned complaints dashboard and incident statistics.";
    if (path.startsWith("/officer/cases")) return "Search, filter, and review active crime reports assigned to you.";
    if (path.startsWith("/officer/case/")) return "Verify evidence uploads, view citizen data, log internal notes, and update statuses.";
    if (path.startsWith("/officer/investigation")) return "Analyze security incident timelines and forensic telemetry.";
    if (path.startsWith("/officer/reports")) return "Generate custom spreadsheets and cryptographically signed audit summaries.";
    if (path.startsWith("/officer/track-status")) return "Audit case status progression and search investigation ledgers.";
    if (path.startsWith("/dashboard")) return "Manage and monitor your submitted cyber crime cases.";
    if (path.startsWith("/admin-dashboard")) return "SOC (Security Operations Center) auditor control room.";
    if (path.startsWith("/admin/users")) return "Search, monitor, and configure registered user accounts.";
    if (path.startsWith("/admin/officers")) return "Search, monitor, and configure security officer registries and assignments.";
    if (path.startsWith("/complaint")) return "Submit a new incident report with encrypted details and attachments.";
    if (path.startsWith("/track-complaint")) return "Real-time investigation progress and case status tracker.";
    if (path.startsWith("/profile")) return "Update your profile details and security credentials.";
    return "";
  };

  // Render dashboard layout for authenticated users
  if (user) {
    const isStaff = user.role === "ROLE_ADMIN" || user.role === "ROLE_OFFICER";
    
    return (
      <div className="dashboard-layout">
        {/* Mobile Header */}
        <div style={{
          display: "none",
          width: "100%",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          padding: "16px 20px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)"
        }} className="mobile-header-bar">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem", margin: 0, color: "var(--text-primary)" }}>
            <Shield size={20} color="var(--accent)" /> Sentinel
          </h2>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Component */}
        <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-brand">
            <h2>
              <Shield size={24} color="var(--accent)" />
              Sentinel Portal
            </h2>
          </div>

          <nav className="sidebar-nav">
            {user.role === "ROLE_ADMIN" && (
              <>
                <NavLink 
                  to="/admin-dashboard" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Admin Panel</span>
                </NavLink>
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Users size={18} />
                  <span>Users Management</span>
                </NavLink>
                <NavLink 
                  to="/admin/officers" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield size={18} />
                  <span>Officers Management</span>
                </NavLink>
              </>
            )}

            {user.role === "ROLE_OFFICER" && (
              <>
                <NavLink 
                  to="/officer" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  end
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink 
                  to="/officer/cases" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  end
                  onClick={() => setMobileOpen(false)}
                >
                  <FilePlus size={18} />
                  <span>Assigned Cases</span>
                </NavLink>
                <NavLink 
                  to="/officer/investigation" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield size={18} />
                  <span>Investigation</span>
                </NavLink>
                <NavLink 
                  to="/officer/reports" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <BarChart3 size={18} />
                  <span>Reports</span>
                </NavLink>
              </>
            )}

            {user.role === "ROLE_CITIZEN" && (
              <>
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Overview</span>
                </NavLink>
                
                <NavLink 
                  to="/complaint" 
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <FilePlus size={18} />
                  <span>File Complaint</span>
                </NavLink>
              </>
            )}

            <NavLink 
              to={user.role === "ROLE_OFFICER" ? "/officer/track-status" : "/track-complaint"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Search size={18} />
              <span>Track Status</span>
            </NavLink>

            <NavLink 
              to="/notifications" 
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <Bell size={18} />
              <span>Alert Center</span>
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--danger)",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 6px var(--danger)"
                }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/profile" 
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <User size={18} />
              <span>Profile Settings</span>
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role === "ROLE_ADMIN" ? "Administrator" : user.role === "ROLE_OFFICER" ? "Officer" : "Citizen"}</span>
              </div>
            </div>
            
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Dashboard Content Container */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }} className="dashboard-content-wrapper">
          {/* Add spacing for fixed mobile header if on small screen */}
          <div style={{ height: "0" }} className="mobile-header-spacer" />
          
          <main className="main-content">
            <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="header-title">
                <h1>{getPageTitle()}</h1>
                <p>{getPageDescription()}</p>
              </div>

              {/* Notification Center */}
              <NotificationBell />
            </header>
            
            <Outlet />
          </main>
        </div>

        {/* CSS inject for mobile header bar responsiveness toggle */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            .mobile-header-bar {
              display: flex !important;
            }
            .mobile-header-spacer {
              height: 65px !important;
            }
            .main-content {
              padding-top: 20px !important;
            }
          }
        `}} />
      </div>
    );
  }

  // Render public layout for guests (logged out users)
  return (
    <div className="app-layout">
      <Navbar />
      <main className="layout-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
