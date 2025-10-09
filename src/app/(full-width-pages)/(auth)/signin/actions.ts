"use server";

import { api } from "@/lib/api"; // ton axios configuré avec Sanctum
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    // Appel API Laravel Sanctum
    const res = await api.post("/login", { email, password });
    console.log(res)
    // Stocke éventuellement le token ou session dans cookies
   /*  cookies().set("token", res.data.token, {
      httpOnly: true,
      secure: true,
      path: "/",
    }); */

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Erreur de connexion" };
  }
}
