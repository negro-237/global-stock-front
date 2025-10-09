// lib/db.ts
import { openDB } from "idb";

export const db = await openDB("stock-app", 4, {
  upgrade(db) {
   
    if (!db.objectStoreNames.contains("auth")) {
      db.createObjectStore("auth");
    }

    // ✅ Table des catégories
    if (!db.objectStoreNames.contains("categories")) {
      const store = db.createObjectStore("categories", {
        keyPath: "id", // chaque catégorie a un ID unique
        autoIncrement: false,
      });

      // Index pour retrouver facilement les éléments non synchronisés
      store.createIndex("unsynced", "unsynced", { unique: false });
    }

    if (!db.objectStoreNames.contains("products")) {
      db.createObjectStore("products", {
        keyPath: "id",
        autoIncrement: false,
      });
    }
  },
});

// --- Fonctions utilitaires pour les catégories ---
export async function addCategory(category: Category) {
  return await db.add("categories", { ...category, unsynced: true });
}

export async function getCategories() {
  return await db.getAll("categories");
}

export async function deleteCategory(id: number) {
  return await db.delete("categories", id);
}

export async function clearCategories() {
  return await db.clear("categories");
}

export async function markCategoryAsSynced(id: number) {
  const category = await db.get("categories", id);
  if (category) {
    category.unsynced = false;
    await db.put("categories", category);
  }
}

// Helpers
export async function setAuthToken(token: string) {
  await db.put("auth", token, "token");
}

export async function getAuthToken() {
  return await db.get("auth", "token");
}

export async function clearAuthToken() {
  await db.delete("auth", "token");
}
