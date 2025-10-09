"use client";

import { useEffect, useState } from "react";
import { api } from "@/../lib/api";
import { db } from "@/../lib/db";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocalCategories = async () => {
    const tx = db.transaction("categories", "readonly");
    const store = tx.objectStore("categories");
    const all = await store.getAll();
    setCategories(all);
    setLoading(false);
    await tx.done;
  };

  const syncPendingCategories = async () => {
   
    const allCategories = await db.getAll("categories");
    const pending = allCategories.filter((c) => c.unsynced === true);
   
    for (const cat of pending) {
      try {
        // Envoi au backend
        const res = await api.post("/categories", { name: cat.name });
        
        // ⚙️ Ouvre une nouvelle transaction pour chaque sync
        const tx = db.transaction("categories", "readwrite");
        const store = tx.objectStore("categories");

        // Met à jour la catégorie locale avec l'id du backend
        await store.delete(cat.id); // supprime temporaire
        const obj = {
          id: res.data.data.id,
          name: res.data.data.name,
          unsynced: false
        }
        await store.put(obj);
      } catch (err) {
        console.error("Sync échouée pour", cat.name, err);
      }
    } 

    loadLocalCategories();
  };

  const addCategory = async (name: string) => {
    setError("");
    
    const tx = db.transaction("categories", "readwrite");
    const store = tx.objectStore("categories");
    const all = await store.getAll();

    // Vérifie si une catégorie existe déjà
    const exists = all.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      console.warn("Catégorie déjà existante :", name);
      return false;
    }

    const newCat = { id: Date.now(), name, unsynced: true };
    await store.put(newCat);
    setCategories((prev) => [...prev, newCat]);

    if (navigator.onLine) {
      await syncPendingCategories();
    }

    return true;
  };

  const checkCategoryHasProducts = async (categoryId: number) => {
    // Ex: IndexedDB
    const allProducts = await db.getAll("products");
    return allProducts.some(p => p.categoryId === categoryId);
  }

  const deleteCategory = async (id: number) => {
    const tx = db.transaction("categories", "readwrite");
    const store = tx.objectStore("categories");
    await store.delete(id);
    await tx.done;
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (navigator.onLine) {
      try {
        await api.delete(`/categories/${id}`);
      } catch (err) {
        console.warn("Impossible de supprimer côté serveur (offline)", err.message);
      }
    }
  };

  useEffect(() => {
    loadLocalCategories();

    // Sync dès qu'on repasse en ligne
    const handleOnline = () => {
      syncPendingCategories();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

    useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        console.log("Sync périodique des catégories");
        syncPendingCategories();
      }
    }, 5 * 60 * 1000); // toutes les 5 minutes

    return () => clearInterval(interval);
  }, []);

  return { 
    categories, 
    loading, 
    addCategory, 
    deleteCategory, 
    error,
    checkCategoryHasProducts
  };
}
