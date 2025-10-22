"use client";

import { useEffect, useState } from "react";
import { api } from "@/../lib/api";
import { db } from "@/../lib/db";

const STORE_NAME = "products";
const STORE_NAME_SUPPLIES = "supplies";

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLocalProducts = async () => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const all = await store.getAll();
        setProducts(all.filter((p) => !p.deleted));
        setLoading(false);
        await tx.done;
    };

    const syncPendingProducts = async () => {
        if (!navigator.onLine) return;  
        const allProducts = await db.getAll(STORE_NAME);

        for (const prod of allProducts) {
            if (!prod.unsynced) continue;   
            try {
                if (prod.deleted) {
                    // Suppression différée
                    await api.delete(`/products/${prod.id}`);
                    // Ouvre une nouvelle transaction après l'appel
                    const tx = db.transaction(STORE_NAME, "readwrite");
                    await tx.store.delete(prod.id);
                    await tx.done;
                }
                else if (prod.id.toString().startsWith("temp-")) {
                    // Produit local à synchroniser
                    const res = await api.post("/products", { 
                        name: prod.name, 
                        category_id: prod.category_id, 
                        price: prod.price, 
                        stock: prod.stock 
                    });
                    const tx = db.transaction(STORE_NAME, "readwrite");
                    await tx.store.delete(prod.id);
                    await tx.store.put({ ...res.data.data, unsynced: false });
                    await tx.done;
                }   
            } catch (err) {
                console.error(`Sync échouée pour ${prod.name} (${err.message})`);
            }
        }

        await loadLocalProducts();
    };

    const addSupply = async (supply: Omit<Supply, "id" | "unsynced" | "deleted">) => {
        
      const tempId = `temp-${Date.now()}`;
      const newSupply = { id: tempId, ...supply, unsynced: true };
      const tx = db.transaction(STORE_NAME_SUPPLIES, "readwrite");
      await tx.store.add(newSupply);
      await tx.done;

      const tx_ = db.transaction(STORE_NAME, "readwrite");
      const store_ = tx_.objectStore(STORE_NAME);
      const existing = await store_.get(parseInt(newSupply.product_id));
     
      if (!existing) {
          console.warn("Produit introuvable pour l'approvisionnement");
          return false;
      }

      const updatedData = { quantity: (existing.quantity || 0) + supply.quantity };
      const updated = { ...existing, ...updatedData, unsynced: true };
      await store_.put(updated);
      await tx_.done;

      if (navigator.onLine) {
        try {
          const res = await api.post(`/products/${supply.product_id}/supplies`, newSupply);
          const saved = res.data.data;
          const tx2 = db.transaction(STORE_NAME_SUPPLIES, "readwrite");
          const store2 = tx2.objectStore(STORE_NAME_SUPPLIES);
          await store2.delete(newSupply.id);
          await store2.put(saved);
          await tx2.done;
        } catch {
          alert("Échec d’ajout sur le serveur — mode hors-ligne");
        }
        
        await loadLocalProducts();
        return true;
      }
    }

    const addProduct = async (product: Omit<Product, "id" | "unsynced" | "deleted">) => {
       
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const existing = (await store.getAll()).find(
          (p) => p.name.toLowerCase() === product.name.toLowerCase()
      );
    
      if (existing && !existing.deleted) {
          alert("Cette catégorie existe déjà !");
          await tx.done;
          return false;
      }

      const newProd: Product = {
          id: navigator.onLine ? Date.now() : `temp-${Date.now()}`,
          name: product.name,
          category_id: product.category_id,
          price: product.price, 
          quantity: product.quantity || 0,
          description: product.description,
          unsynced: !navigator.onLine,
      };

      await store.put(newProd);
      await tx.done;

      const tempId = `temp-${Date.now()}`;
      const supply = { product_id: String(newProd.id), quantity: newProd.quantity || 0 };
      const newSupply = { id: tempId, ...supply, unsynced: true };
      const tx_1 = db.transaction(STORE_NAME_SUPPLIES, "readwrite");
      const store_1 = tx_1.objectStore(STORE_NAME_SUPPLIES);
      await store_1.put(newSupply);
      await tx_1.done;

      if (navigator.onLine) {
        try {
          const res = await api.post("/products", newProd);
          const product = res.data.data.product;
          const supply = res.data.data.supply;
          
          const tx2 = db.transaction(STORE_NAME, "readwrite");
          const store2 = tx2.objectStore(STORE_NAME);
          await store2.delete(newProd.id);
          await store2.put(product);
          await tx2.done;

          const tx_2 = db.transaction(STORE_NAME_SUPPLIES, "readwrite");
          const store_2 = tx_2.objectStore(STORE_NAME_SUPPLIES);
          await store_2.delete(newSupply.id);
          await store_2.put(supply);
          await tx_2.done;

        } catch {
          console.warn("Échec d’ajout sur le serveur — mode hors-ligne");
        }
      }
      
      await loadLocalProducts();
      return true;
    };

    const editProduct = async (id: number | string, updates: Partial<Product>) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const existing = await store.get(id);

      if (!existing) {
        console.warn("Produit introuvable");
        await tx.done;
        return false;
      }

      const updated = { ...existing, ...updates, unsynced: !navigator.onLine };
      await store.put(updated);
      await tx.done;

      if (navigator.onLine) {
        try {
          const res = await api.put(`/products/${id}`, updates);
          const saved = res.data.data;
          const tx2 = db.transaction(STORE_NAME, "readwrite");
          await tx2.store.put({ ...saved, unsynced: false });
          await tx2.done;
        } catch (err) {
          console.warn("Échec de mise à jour serveur, mode hors-ligne", err);
        }
      }

      await loadLocalProducts();
      return true;
   };

    const deleteProduct = async (id: number | string) => {
        // Récupération locale d'abord (transaction courte)
        let product: Product | undefined;
        
        {
          const tx = db.transaction(STORE_NAME, "readonly");
          product = await tx.store.get(id);
          await tx.done;
        }
    
        if (!product) return;
    
        if (navigator.onLine) {
          try {
            // Appel API (transaction fermée pendant ce temps)
            await api.delete(`/products/${id}`);
    
            // Nouvelle transaction juste pour supprimer localement
            const tx2 = db.transaction(STORE_NAME, "readwrite");
            await tx2.store.delete(id);
            await tx2.done;
          } catch (err) {
            console.warn("Suppression serveur échouée, marquée comme offline", err);
    
            const tx3 = db.transaction(STORE_NAME, "readwrite");
            await tx3.store.put({ ...product, deleted: true, unsynced: true });
            await tx3.done;
          }
        } else {
          // Mode hors ligne : marquer la suppression
          const tx4 = db.transaction(STORE_NAME, "readwrite");
          await tx4.store.put({ ...product, deleted: true, unsynced: true });
          await tx4.done;
        }
    
        await loadLocalProducts();
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
          if (navigator.onLine) {
            const res = await api.get("/products");
            const serverData = res.data.data;
            console.log('server', serverData);
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
    
            // Remplace les données locales
            await store.clear();
            for (const cat of serverData) {
              await store.put(cat);
            }
            await tx.done;
    
            setProducts(serverData);
          } else {
            await loadLocalProducts();
          }
        } catch (err) {
          //alert("Impossible de charger les catégories");
          await loadLocalProducts();
        } finally {
          setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        window.addEventListener("online", syncPendingProducts);
        return () => window.removeEventListener("online", syncPendingProducts);
    }, []);

    return {
        products,
        loading,
        error,
        addProduct,
        deleteProduct,
        setError,
        addSupply,
        editProduct
    };
}
