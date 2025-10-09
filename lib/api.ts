// lib/api.ts
import axios from "axios";
import { get } from "idb-keyval";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Intercepteur pour ajouter le token si présent dans IndexedDB
api.interceptors.request.use(async (config) => {
  const token = await get("token"); // récupéré depuis IndexedDB
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;

