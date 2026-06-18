import { useEffect, useState } from "react";
import { User, Key, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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
      // Reload stats
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
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Overview */}
      <div className="profile-card" style={{ marginBottom: "30px" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "none", marginBottom: 0 }}>
          <User size={32} color="var(--primary)" /> User Account Profile
        </h1>
        <hr />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
          <div>
            <h3><strong>Name:</strong> {profile?.name}</h3>
            <h3><strong>Email:</strong> {profile?.email}</h3>
          </div>
          <div>
            <h3><strong>Phone:</strong> {profile?.phone}</h3>
            <h3><strong>Account Role:</strong> <span style={{ color: "var(--primary)", fontWeight: "600" }}>{profile?.role?.replace("ROLE_", "")}</span></h3>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="profile-stats" style={{ marginBottom: "50px" }}>
        <div className="stat-box">
          <h2>{profile?.totalComplaints || 0}</h2>
          <p>Total Complaints</p>
        </div>

        <div className="stat-box">
          <h2>{profile?.pendingComplaints || 0}</h2>
          <p>Pending Review</p>
        </div>

        <div className="stat-box">
          <h2>{profile?.resolvedComplaints || 0}</h2>
          <p>Resolved</p>
        </div>
      </div>

      {/* Editing section */}
      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        {/* Update details */}
        <div className="profile-card" style={{ flex: 1, minWidth: "320px", marginBottom: 0 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.4rem", fontWeight: "700", marginBottom: "20px" }}>
            <Shield size={22} color="var(--primary)" /> Update Information
          </h2>
          <hr />

          {profileError && <p style={{ color: "#c62828", marginBottom: "15px", fontWeight: "500" }}>{profileError}</p>}
          {profileSuccess && <p style={{ color: "#137333", marginBottom: "15px", fontWeight: "600" }}>{profileSuccess}</p>}

          <form onSubmit={handleProfileUpdate}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                marginBottom: "20px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)"
              }}
            />

            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Phone Number</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                marginBottom: "25px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)"
              }}
            />

            <button type="submit" style={{
              width: "100%",
              padding: "12px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "var(--transition)"
            }}>
              Update Profile
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="profile-card" style={{ flex: 1, minWidth: "320px", marginBottom: 0 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.4rem", fontWeight: "700", marginBottom: "20px" }}>
            <Key size={22} color="var(--primary)" /> Change Password
          </h2>
          <hr />

          {passError && <p style={{ color: "#c62828", marginBottom: "15px", fontWeight: "500" }}>{passError}</p>}
          {passSuccess && <p style={{ color: "#137333", marginBottom: "15px", fontWeight: "600" }}>{passSuccess}</p>}

          <form onSubmit={handlePasswordChange}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                marginBottom: "15px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)"
              }}
            />

            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password (min 8 chars)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                marginBottom: "15px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)"
              }}
            />

            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                marginBottom: "25px",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-primary)"
              }}
            />

            <button type="submit" disabled={passLoading} style={{
              width: "100%",
              padding: "12px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "var(--transition)"
            }}>
              {passLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
