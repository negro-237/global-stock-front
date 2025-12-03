"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/../lib/api";
import { db } from "@/../lib/db";

const STORE_NAME = "categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocalCategories = useCallback(async () => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const all = await store.getAll();
    setCategories(all.filter((c) => !c.deleted));
    setLoading(false);
    await tx.done;
  }, []);

  const syncPendingCategories = useCallback(async () => {
    if (!navigator.onLine) return;

    const allCategories = await db.getAll(STORE_NAME);

    for (const cat of allCategories) {
      if (!cat.unsynced) continue;

      try {
        if (cat.deleted) {
          // Suppression différée
          await api.delete(`/categories/${cat.id}`);

          // Ouvre une nouvelle transaction après l'appel
          const tx = db.transaction(STORE_NAME, "readwrite");
          await tx.store.delete(cat.id);
          await tx.done;
        } 
        else if (cat.id.toString().startsWith("temp-")) {
          // Catégorie locale à synchroniser
          const res = await api.post("/categories", { name: cat.name });

          const tx = db.transaction(STORE_NAME, "readwrite");
          await tx.store.delete(cat.id);
          await tx.store.put({ ...res.data.data, unsynced: false });
          await tx.done;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Sync échouée pour ${cat.name} (${errorMessage})`);
      }
    }

    await loadLocalCategories();
  }, [loadLocalCategories]);


  const addCategory = async (name: string) => {
    
    setError("");

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const existing = (await store.getAll()).find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing && !existing.deleted) {
      setError("Cette catégorie existe déjà !");
      await tx.done;
      return false;
    }

    const newCat: Category = {
      id: navigator.onLine ? Date.now() : `temp-${Date.now()}`,
      name,
      unsynced: !navigator.onLine,
    };

    await store.put(newCat);
    await tx.done;
    setError('');

    if (navigator.onLine) {
      try {
        const res = await api.post("/categories", { name });
        const saved = res.data.data;
        const tx2 = db.transaction(STORE_NAME, "readwrite");
        const store2 = tx2.objectStore(STORE_NAME);
        await store2.delete(newCat.id);
        await store2.put(saved);
        await tx2.done;
      } catch {
        console.warn("Échec d’ajout sur le serveur — mode hors-ligne");
      }
    }

    await loadLocalCategories();
    return true;
  };

  const checkCategoryHasProducts = async (categoryId: number) => {
    // Ex: IndexedDB
    const allProducts = await db.getAll("products");
    return allProducts.some(p => p.categoryId === categoryId);
  }

  const deleteCategory = async (id: number | string) => {
    // Récupération locale d'abord (transaction courte)
    let category;
    {
      const tx = db.transaction(STORE_NAME, "readonly");
      category = await tx.store.get(id);
      await tx.done;
    }

    if (!category) return;

    if (navigator.onLine) {
      try {
        // Appel API (transaction fermée pendant ce temps)
        await api.delete(`/categories/${id}`);

        // Nouvelle transaction juste pour supprimer localement
        const tx2 = db.transaction(STORE_NAME, "readwrite");
        await tx2.store.delete(id);
        await tx2.done;
      } catch (err) {
        console.warn("Suppression serveur échouée, marquée comme offline", err);

        const tx3 = db.transaction(STORE_NAME, "readwrite");
        await tx3.store.put({ ...category, deleted: true, unsynced: true });
        await tx3.done;
      }
    } else {
      // Mode hors ligne : marquer la suppression
      const tx4 = db.transaction(STORE_NAME, "readwrite");
      await tx4.store.put({ ...category, deleted: true, unsynced: true });
      await tx4.done;
    }

    await loadLocalCategories();
  };


  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const res = await api.get("/categories");
        const serverData = res.data.data;

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        // Remplace les données locales
        await store.clear();
        for (const cat of serverData) {
          await store.put(cat);
        }
        await tx.done;

        setCategories(serverData);
      } else {
        await loadLocalCategories();
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Impossible de charger les catégories");
      await loadLocalCategories();
    } finally {
      setLoading(false);
    }
  }, [loadLocalCategories]);

useEffect(() => {
  fetchCategories();
  window.addEventListener("online", syncPendingCategories);
  return () => window.removeEventListener("online", syncPendingCategories);
}, [fetchCategories, syncPendingCategories]);

  return { 
    categories, 
    loading, 
    addCategory, 
    deleteCategory, 
    error,
    checkCategoryHasProducts
  };
}
