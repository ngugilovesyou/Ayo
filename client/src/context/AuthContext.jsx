import { createContext, useState, useCallback } from "react";
import { auth } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [authed, setAuthed] = useState(auth.isAuthenticated());
  const [checking, setChecking] = useState(true);

  const isAuthenticated = useCallback(() => authed, [authed]);

  const verify = useCallback(async () => {
    setChecking(true);

    try {
      if (auth.isAuthenticated()) {
        const res = await auth.verify();
        setAdmin(res.admin);
        setAuthed(true);
      } else {
        setAdmin(null);
        setAuthed(false);
      }
    } catch {
      setAdmin(null);
      setAuthed(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await auth.login(email, password);
    setAdmin(res.admin);
    setAuthed(true);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setAdmin(null);
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        authed,
        checking,
        isAuthenticated,
        verify,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}