import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TrackComplaint from "./pages/TrackComplaint";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOfficers from "./pages/AdminOfficers";
import OfficerDashboard from "./pages/OfficerDashboard";
import AssignedCases from "./pages/AssignedCases";
import CaseDetails from "./pages/CaseDetails";
import Investigation from "./pages/Investigation";
import Reports from "./pages/Reports";
import TrackStatus from "./pages/TrackStatus";
import Unauthorized from "./pages/Unauthorized";
import Layout from "./components/Layout";
import NotificationPanel from "./components/NotificationPanel";
import "./App.css";

// Route Guard for general authenticated users (e.g. Profile)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Checking authentication...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Route Guard for Citizen role
const CitizenRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Checking authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ROLE_CITIZEN") return <Navigate to="/unauthorized" replace />;

  return children;
};

// Route Guard for Administrator role
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Checking authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ROLE_ADMIN") return <Navigate to="/unauthorized" replace />;

  return children;
};

// Route Guard for Officer role
const OfficerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Checking authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ROLE_OFFICER") return <Navigate to="/unauthorized" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/track-complaint" element={<TrackComplaint />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Citizen Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <CitizenRoute>
                    <Dashboard />
                  </CitizenRoute>
                }
              />
              <Route
                path="/complaint"
                element={
                  <CitizenRoute>
                    <NewComplaint />
                  </CitizenRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin-dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/officers"
                element={
                  <AdminRoute>
                    <AdminOfficers />
                  </AdminRoute>
                }
              />

              {/* Officer Protected Routes */}
              <Route
                path="/officer"
                element={
                  <OfficerRoute>
                    <OfficerDashboard />
                  </OfficerRoute>
                }
              />
              <Route
                path="/officer/cases"
                element={
                  <OfficerRoute>
                    <AssignedCases />
                  </OfficerRoute>
                }
              />
              <Route
                path="/officer/case/:id"
                element={
                  <OfficerRoute>
                    <CaseDetails />
                  </OfficerRoute>
                }
              />
              <Route
                path="/officer/investigation"
                element={
                  <OfficerRoute>
                    <Investigation />
                  </OfficerRoute>
                }
              />
              <Route
                path="/officer/reports"
                element={
                  <OfficerRoute>
                    <Reports />
                  </OfficerRoute>
                }
              />
              <Route
                path="/officer/track-status"
                element={
                  <OfficerRoute>
                    <TrackStatus />
                  </OfficerRoute>
                }
              />

              {/* Shared Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationPanel />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
