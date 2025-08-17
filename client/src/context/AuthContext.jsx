import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendURL = "http://localhost:5002";
axios.defaults.baseURL = backendURL;
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connect socket function
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendURL, {
      query: {
        userId: userData._id,
      },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  // Check auth status with improved error handling
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No token found in localStorage");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Checking auth with token:", token.substring(0, 20) + "...");
      
      // Set the token in headers before making the request
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Also try with 'token' header as your backend might expect this format
      axios.defaults.headers.common["token"] = token;
      
      const { data } = await axios.get("/api/auth/check");
      console.log("Auth check response:", data);
      
      if (data.success) {
        // Handle different possible response formats from backend
        const userData = data.user || data.userData || data.data;
        
        if (userData) {
          console.log("Auth check successful, setting user:", userData);
          setAuthUser(userData);
          connectSocket(userData);
        } else {
          console.log("Auth check failed - no user data in response:", data);
          console.log("Expected user data in: data.user, data.userData, or data.data");
          clearAuthState();
        }
      } else {
        console.log("Auth check failed - success: false:", data);
        clearAuthState();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      // Handle different error scenarios
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Token expired or invalid");
        toast.error("Session expired. Please login again.");
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.log("Network error - server might be down");
        toast.error("Unable to connect to server. Please check your connection.");
      } else {
        console.log("Unknown auth error");
      }
      
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to clear auth state
  const clearAuthState = () => {
    localStorage.removeItem("token");
    setAuthUser(null);
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["token"];
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Login with better error handling
  const login = async (state, credentials) => {
    try {
      console.log("Attempting login/signup:", state);
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      console.log("Login response:", data);
      
      if (data.success && data.userData && data.token) {
        // Set everything immediately
        setAuthUser(data.userData);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        axios.defaults.headers.common["token"] = data.token;
        connectSocket(data.userData);
        toast.success(data.message);
        console.log("Login successful, user set:", data.userData);
        return true;
      } else {
        console.log("Login failed - invalid response:", data);
        toast.error(data.message || "Login failed.");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Login error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  // Logout
  const logout = () => {
    console.log("Logging out user");
    clearAuthState();
    setOnlineUsers([]);
    toast.success("Logged out successfully");
  };

  // Update profile with better error handling
  const updateProfile = async (body) => {
    try {
      console.log("Updating profile with:", body);
      console.log("Current authUser before update:", authUser);
      
      const { data } = await axios.put("api/auth/update-profile", body);
      console.log("Update profile response:", data);
      
      if (data.success && (data.user || data.updatedUser)) {
        const userData = data.user || data.updatedUser;
        console.log("Setting authUser to:", userData);
        setAuthUser(userData);
        toast.success("Profile Updated Successfully");
        return true;
      } else {
        console.log("Update failed - no user data in response");
        toast.error(data.message || "Profile update failed");
        return false;
      }
    } catch (error) {
      console.error("Profile update error:", error);
      console.error("Profile update error response:", error.response?.data);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Authentication failed during profile update");
        clearAuthState();
        toast.error("Session expired. Please login again.");
        return false;
      }
      
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  // Initialize auth on mount - runs only once
  useEffect(() => {
    console.log("AuthProvider initializing...");
    checkAuth();
    
    // Cleanup function
    return () => {
      if (socket) {
        console.log("Cleaning up socket connection");
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array - runs only once

  // Add axios interceptor to handle token expiry globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && authUser) {
          console.log("Token expired during API call");
          clearAuthState();
          toast.error("Session expired. Please login again.");
          // Optionally redirect to login page here
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [authUser]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};