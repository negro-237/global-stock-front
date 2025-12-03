"use client";

import { useAuthStore } from "@/../stores/authStore";
import { api } from "@/../lib/api";
import { get, set, del } from "idb-keyval";
import { useEffect, useState } from "react";

export function useAuth() {
  const { user, token, setUser, setToken, logout: logoutStore } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Réhydrate Zustand depuis IndexedDB au démarrage
  useEffect(() => {
    const init = async () => {
      const storedUser = await get("user");
      const storedToken = await get("token");
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }
      setLoading(false);
    };
    init();
  }, [setUser, setToken]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/login", { email, password });
      const userData = {
        name: res.data.data.name,
        email: res.data.data.email,
        roles: res.data.data.roles
    };
      const userToken = res.data.data.token;

      setUser(userData);
      setToken(userToken);

      await set("user", userData);
      await set("token", userToken);

      return userData;
    } catch (err: unknown) {
      const message =
        (err instanceof Error ? err.message : null) ||
        (err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.message : null) ||
        (err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.error : null) ||
        "Erreur de connexion";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      console.warn("Logout échoué, peut-être offline");
    }
    logoutStore();
    await del("user");
    await del("token");
  };

  return { user, token, login, logout, loading, isAuthenticated: !!user };
}




 