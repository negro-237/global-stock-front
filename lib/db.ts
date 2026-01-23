// lib/db.ts
import { openDB, IDBPDatabase } from "idb"; // Importez IDBPDatabase pour le type

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDb = (): Promise<IDBPDatabase> => {
    if (dbPromise) {
        return dbPromise; // Retourne la promesse existante
    }

    dbPromise = openDB("Fluxo", 7, {
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
            
            if (!db.objectStoreNames.contains("supplies")) {
                db.createObjectStore("supplies", {
                    keyPath: "id",
                    autoIncrement: false,
                });
            }

            if (!db.objectStoreNames.contains("customers")) {
                db.createObjectStore("customers", {
                    keyPath: "id",
                    autoIncrement: false,
                });
            }

            if (!db.objectStoreNames.contains("orders")) {
                db.createObjectStore("orders", {
                    keyPath: "id",
                    autoIncrement: false,
                });
            }
        },
    }) as Promise<IDBPDatabase>; // Ajoutez un cast de type si nécessaire

    return dbPromise;
};

// ANCIEN CODE (SUPPRIMER):
// export const db = await openDB("Fluxo", 7, { ... });