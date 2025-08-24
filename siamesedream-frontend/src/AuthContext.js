import React, { createContext, useState, useEffect } from "react";

// Create the context
export const AuthContext = createContext();

// Provider component to wrap your app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On mount, load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Login function (call when user logs in)
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Logout function (call when user logs out)
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
