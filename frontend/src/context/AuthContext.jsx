import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../services/api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "triad_token";
const USER_KEY = "triad_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    persist(data.access_token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clear();
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get("/auth/me")
      .then((r) => {
        setUser(r.data);
        localStorage.setItem(USER_KEY, JSON.stringify(r.data));
      })
      .catch(() => clear())
      .finally(() => setLoading(false));
  }, [clear]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
