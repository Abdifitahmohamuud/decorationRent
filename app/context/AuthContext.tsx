"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      const storedToken = localStorage.getItem("auth_token");

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser?.id && parsedUser?.email && parsedUser?.role) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token");
        }
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("auth_token", token);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    
    // Clear the HTTP-only cookie by calling a logout API (optional but good)
    await fetch("/api/auth/logout", { method: "POST" });
    
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
