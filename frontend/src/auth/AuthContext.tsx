import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    void api.logout();
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    const me = await api.me();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
    const onUnauthorized = () => setUser(null);
    window.addEventListener("flowboard:unauthorized", onUnauthorized);
    return () => window.removeEventListener("flowboard:unauthorized", onUnauthorized);
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password });
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await api.register({ name, email, password });
    setToken(token);
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
