import { useEffect, useState } from "react";
import { User, Key, Shield, Phone, Mail, FileText, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";

function Profile() {
  const { user: authUser, updateProfileState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/me");
      setProfile(response.data);
      setProfileForm({
        name: response.data.name,
        phone: response.data.phone,
      });
    } catch (err) {
      console.error("Error fetching profile", err);
      setProfileError("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileForm.name || !profileForm.phone) {
      setProfileError("Please fill all profile fields");
      return;
    }

    try {
      const response = await api.put("/users/me", profileForm);
      setProfileSuccess("Profile updated successfully!");
      updateProfileState(response.data);
      fetchProfile();
    } catch (err) {
      console.error("Profile update failed", err);
      setProfileError(err.response?.data?.error || "Failed to update profile details");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPassError("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPassError("New password must be at least 8 characters long");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError("New passwords do not match");
      return;
    }

    setPassLoading(true);
    try {
      await api.put("/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPassSuccess("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change failed", err);
      setPassError(err.response?.data?.error || err.response?.data?.message || "Failed to change password. Verify your current password.");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        textAlign: "center",
        padding: "80px 40px",
        background: "var(--glass-bg)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        color: "var(--text-secondary)"
      }}>
        Loading profile configuration...
      </div>
    );
  }

  return (
    <motion.div 
      className="profile-container" 
      style={{ padding: 0, width: "100%" }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 15 }}
    >
      {/* Profile Overview Card */}
      <div className="profile-card" style={{ marginBottom: "30px" }}>
        <h2>
          <User size={22} color="var(--primary)" style={{ filter: "drop-shadow(0 0 6px var(--primary-glow))" }} /> 
          <span>Citizen Identity Profile</span>
        </h2>
        <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "20px 0" }} />
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <User size={16} /> <strong>Name:</strong> {profile?.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <Mail size={16} /> <strong>Email:</strong> {profile?.email}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <Phone size={16} /> <strong>Phone:</strong> {profile?.phone}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <Shield size={16} /> <strong>Role:</strong> <span style={{ color: "var(--accent)", fontWeight: "600" }}>{profile?.role?.replace("ROLE_", "")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Activity Metrics */}
      <div className="stats-container" style={{ marginBottom: "40px" }}>
        <div className="stat-card" style={{ padding: "20px" }}>
          <div className="stat-card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <FileText size={20} />
          </div>
          <div className="stat-card-info">
            <h2>{profile?.totalComplaints || 0}</h2>
            <p>Total Submissions</p>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "20px" }}>
          <div className="stat-card-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            <Clock size={20} />
          </div>
          <div className="stat-card-info">
            <h2>{profile?.pendingComplaints || 0}</h2>
            <p>Pending Audits</p>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "20px" }}>
          <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-card-info">
            <h2>{profile?.resolvedComplaints || 0}</h2>
            <p>Resolved Cases</p>
          </div>
        </div>
      </div>

      {/* Editing Dual Columns */}
      <div className="profile-grid">
        {/* Info Update */}
        <div className="profile-card">
          <h2>
            <Shield size={20} color="var(--accent)" /> <span>Update Information</span>
          </h2>
          <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "15px 0" }} />

          {profileError && <div className="alert-error" style={{ marginBottom: "15px" }}>{profileError}</div>}
          {profileSuccess && <div className="alert-success" style={{ marginBottom: "15px" }}>{profileSuccess}</div>}

          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                required
              />
            </div>

            <button type="submit" style={{ width: "100%", marginTop: "10px" }}>
              Save Details
            </button>
          </form>
        </div>

        {/* Password Update */}
        <div className="profile-card">
          <h2>
            <Key size={20} color="var(--primary)" /> <span>Change Password</span>
          </h2>
          <hr style={{ border: 0, height: "1px", background: "var(--border-color)", margin: "15px 0" }} />

          {passError && <div className="alert-error" style={{ marginBottom: "15px" }}>{passError}</div>}
          {passSuccess && <div className="alert-success" style={{ marginBottom: "15px" }}>{passSuccess}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={passLoading} style={{ width: "100%", marginTop: "10px" }}>
              {passLoading ? "Updating Key..." : "Establish New Key"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;
