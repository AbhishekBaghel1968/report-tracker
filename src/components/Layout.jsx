import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, FilePlus, Search, User, LogOut, Menu, X, BarChart3, Bell, BellOff, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications = [], unreadCount = 0, markAllAsRead = () => {}, clearNotifications = () => {} } = useSocket() || {};

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
              {isStaff && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) markAllAsRead();
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-color)",
                      padding: "10px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      color: unreadCount > 0 ? "var(--accent)" : "var(--text-secondary)",
                      position: "relative",
                      transition: "var(--transition)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                  >
                    {unreadCount > 0 ? <Bell size={20} className="shake-animation" /> : <BellOff size={20} />}
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        background: "var(--danger)",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px var(--danger)"
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown list */}
                  {showNotifications && (
                    <div style={{
                      position: "absolute",
                      top: "45px",
                      right: 0,
                      width: "320px",
                      background: "rgba(10, 10, 18, 0.96)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                      zIndex: 999,
                      overflow: "hidden"
                    }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "700", fontSize: "0.85rem" }}>Security Alerts</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={clearNotifications} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem" }}>Clear</button>
                          <button onClick={() => setShowNotifications(false)} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.75rem" }}>Close</button>
                        </div>
                      </div>

                      <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: "30px 16px", textCol: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                            No notifications logged in this session.
                          </div>
                        ) : (
                          notifications.map((notif, index) => (
                            <div 
                              key={index} 
                              style={{ 
                                padding: "12px 16px", 
                                borderBottom: index < notifications.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                                fontSize: "0.8rem",
                                background: index === 0 && unreadCount > 0 ? "rgba(0, 240, 255, 0.02)" : "transparent"
                              }}
                            >
                              <p style={{ color: "var(--text-primary)", lineHeight: "1.4" }}>{notif.message}</p>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "inline-block" }}>
                                {new Date(notif.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
