import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AdminSafe, type UserSafe } from "@/lib/api";

type AuthValue = {
  user: UserSafe | null;
  admin: AdminSafe | null;
  userToken: string | null;
  adminToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserSafe>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<UserSafe>;
  logout: () => void;
  setSessionFromToken: (token: string, user: UserSafe) => void;
  setUser: (user: UserSafe) => void;
  adminLogin: (email: string, password: string) => Promise<AdminSafe>;
  adminLogout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const USER_KEY = "aperture-user-token";
const ADMIN_KEY = "aperture-admin-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSafe | null>(null);
  const [admin, setAdmin] = useState<AdminSafe | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ut = localStorage.getItem(USER_KEY);
      const at = localStorage.getItem(ADMIN_KEY);
      try {
        if (ut) {
          setUserToken(ut);
          const { user: u } = await authApi.me();
          if (!cancelled) setUser(u);
        }
      } catch {
        localStorage.removeItem(USER_KEY);
      }
      try {
        if (at) {
          setAdminToken(at);
          const { admin: a } = await authApi.adminMe();
          if (!cancelled) setAdmin(a);
        }
      } catch {
        localStorage.removeItem(ADMIN_KEY);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await authApi.login({ email, password });
    localStorage.setItem(USER_KEY, token);
    setUserToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const { token, user: u } = await authApi.register(input);
      localStorage.setItem(USER_KEY, token);
      setUserToken(token);
      setUser(u);
      return u;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUserToken(null);
    setUser(null);
  }, []);

  const setSessionFromToken = useCallback((token: string, u: UserSafe) => {
    localStorage.setItem(USER_KEY, token);
    setUserToken(token);
    setUser(u);
  }, []);

  const setUserSafe = useCallback((u: UserSafe) => {
    setUser(u);
  }, []);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const { token, admin: a } = await authApi.adminLogin({ email, password });
    localStorage.setItem(ADMIN_KEY, token);
    setAdminToken(token);
    setAdmin(a);
    return a;
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    setAdminToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      userToken,
      adminToken,
      loading,
      login,
      register,
      logout,
      setSessionFromToken,
      setUser: setUserSafe,
      adminLogin,
      adminLogout,
    }),
    [
      user,
      admin,
      userToken,
      adminToken,
      loading,
      login,
      register,
      logout,
      setSessionFromToken,
      setUserSafe,
      adminLogin,
      adminLogout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
