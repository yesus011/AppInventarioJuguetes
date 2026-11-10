import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "inventory_access_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    apiRequest("/auth/me", { token })
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, [token]);

  async function login(credentials) {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    sessionStorage.setItem(TOKEN_KEY, result.access_token);
    setToken(result.access_token);
    setUser(result.user);
    setReady(true);
    return result.user;
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}