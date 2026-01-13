"use client";

import { useAuthStore } from "@/../stores/authStore";
import { api } from "@/../lib/api";
import { get, set, del } from "idb-keyval";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const { user, token, setUser, setToken, logout: logoutStore } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if(res.data.message == "first") {
        router.push("/password");
        //return;
      }

      const userData = {
        name: String(res.data.data.name),
        email: String(res.data.data.email),
        phone: String(res.data.data.phone),
        roles: [String(res.data.data.roles)]
      };
      const userToken = res.data.data.token;

      setUser(userData);
      setToken(userToken);

      await set("user", userData);
      await set("token", userToken);

      router.push("/");
    } catch (err: unknown) {
      setError((err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.message : null) ||
        (err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.error : null) ||
        "Erreur de connexion");
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
      logoutStore();
      await del("user");
      await del("token");
      router.push("/signin");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      console.warn("Logout échoué, peut-être offline");
    }
  };

  const reset = async (password: string, confirmation_password: string) => {
    try {
      const res = await api.post("/reset-password", { password, confirmation_password });
      return res.data;
    } catch (err: unknown) {
      const message =
        (err instanceof Error ? err.message : null) ||
        (err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.message : null) ||
        (err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.data?.error : null) ||
        "Erreur de réinitialisation du mot de passe";
      throw new Error(message);
    }
  };

  return { user, token, login, logout, loading, isAuthenticated: !!user, reset, error, setError };
}




 