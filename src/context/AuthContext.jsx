import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored credentials on initialization
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set default header
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: jwt, id, name, email: userEmail, role } = response.data;

      localStorage.setItem("token", jwt);
      localStorage.setItem("user", JSON.stringify({ id, name, email: userEmail, role }));
      
      setToken(jwt);
      setUser({ id, name, email: userEmail, role });

      // Configure default auth header for all subsequent API requests
      api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

      return { success: true, role };
    } catch (error) {
      console.error("Login failed", error);
      if (!error.response) {
        return { success: false, error: "Could not connect to the backend server. Please verify it is running." };
      }
      const message = error.response?.data?.error || error.response?.data?.message || "Invalid email or password";
      return { success: false, error: message };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      await api.post("/auth/register", { name, email, phone, password });
      return { success: true };
    } catch (error) {
      console.error("Registration failed", error);
      if (!error.response) {
        return { success: false, error: "Could not connect to the backend server. Please verify it is running." };
      }
      // Grab validation errors if any
      const validationErrors = error.response?.data;
      let message = "Registration failed. Please try again.";
      if (validationErrors) {
        if (typeof validationErrors === "object") {
          message = Object.values(validationErrors).join(", ");
        } else if (typeof validationErrors === "string") {
          message = validationErrors;
        }
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common["Authorization"];
    }
  };

  const updateProfileState = (updatedUser) => {
    const freshUser = { ...user, name: updatedUser.name, phone: updatedUser.phone };
    localStorage.setItem("user", JSON.stringify(freshUser));
    setUser(freshUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
