"use client";

import { useEffect, useState } from "react";
import { api } from "@/../lib/api";
import { db } from "@/../lib/db";

const STORE_NAME_CUSTOMERS = "customers";
const STORE_NAME_ORDERS = "orders";

export function useOrders() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadLocalData = async () => {
        const tx = db.transaction(STORE_NAME_CUSTOMERS, "readonly");
        const store = tx.objectStore(STORE_NAME_CUSTOMERS);
        const all = await store.getAll();
        const arr = all.filter((c) => !c.deleted);
        const newArr = [];
        arr.map((c) => (
            newArr.push({ value: c.id, label: (c.name).toUpperCase(), price: c.price })
        ))
        setCustomers(newArr);
        setLoading(false);
        await tx.done;
    };

    const addOrder = async (order: Omit<Order, "id" | "unsynced" | "deleted">) => {
        
        setIsSubmitting(true);
        const tx = db.transaction(STORE_NAME_ORDERS, "readwrite");
        const store = tx.objectStore(STORE_NAME_ORDERS);

        const newOrder: Order = {
            id: navigator.onLine ? Date.now() : `temp-${Date.now()}`,
            customer_id: order.customer_id,
            products: order.products, 
            unsynced: !navigator.onLine,
       };

        await store.put(newOrder);
        await tx.done;

        if (navigator.onLine) {
            try {
                const res = await api.post("/orders", newOrder);
                const order = res.data.data;
                
                const tx2 = db.transaction(STORE_NAME_ORDERS, "readwrite");
                const store2 = tx2.objectStore(STORE_NAME_ORDERS);
                await store2.delete(newOrder.id);
                await store2.put(order);
                await tx2.done;
    
            } catch {
                setError("Échec d’ajout sur le serveur — mode hors-ligne");
                console.warn("Échec d’ajout sur le serveur — mode hors-ligne");
            }
        }

        //await loadLocalData();
        setIsSubmitting(false);
        return true;

    }

    const addCustomer = async (customer: Omit<Customer, "id" | "unsynced" | "deleted">) => {

        const tx = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
        const store = tx.objectStore(STORE_NAME_CUSTOMERS);

        const existing = (await store.getAll()).find(
            (p) => p.name.toLowerCase() === customer.name.toLowerCase()
        );

        if (existing && !existing.deleted) {
          alert("Ce client existe déjà !");
          await tx.done;
          return false;
        }

        const newCustomer: Customer = {
            id: navigator.onLine ? Date.now() : `temp-${Date.now()}`,
            name: customer.name,
            phone: customer.phone ? customer.phone : undefined,
            address: customer.address ? customer.address : undefined, 
            unsynced: !navigator.onLine,
       };

        await store.put(newCustomer);
        await tx.done;
        
        if (navigator.onLine) {
            try {
                const res = await api.post("/customers", newCustomer);
                const customer = res.data.data;
                
                const tx2 = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                const store2 = tx2.objectStore(STORE_NAME_CUSTOMERS);
                await store2.delete(newCustomer.id);
                await store2.put(customer);
                await tx2.done;
    
            } catch {
                console.warn("Échec d’ajout sur le serveur — mode hors-ligne");
            }
        }
              
        await loadLocalData();
        return true;
    }

    const syncPendingData = async () => {
        if (!navigator.onLine) return;  
        const allClients = await db.getAll(STORE_NAME_CUSTOMERS);

        for (const prod of allClients) {
            if (!prod.unsynced) continue;   
            try {
                if (prod.deleted) {
                    // Suppression différée
                    await api.delete(`/customers/${prod.id}`);
                    // Ouvre une nouvelle transaction après l'appel
                    const tx = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                    await tx.store.delete(prod.id);
                    await tx.done;
                }
                else if (prod.id.toString().startsWith("temp-")) {
                    // Produit local à synchroniser
                    const res = await api.post("/customers", { 
                        name: prod.name
                    });
                    const tx = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                    await tx.store.delete(prod.id);
                    await tx.store.put({ ...res.data.data, unsynced: false });
                    await tx.done;
                }   
            } catch (err) {
                console.error(`Sync échouée pour ${prod.name} (${err.message})`);
            }
        }

        await loadLocalData();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (navigator.onLine) {
                const res = await api.get("/customers");
                const clients = res.data.data.customers;
                const products = res.data.data.products;
                
                const tx = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                const store = tx.objectStore(STORE_NAME_CUSTOMERS);
        
                // Remplace les données locales
                await store.clear();
                for (const cat of clients) {
                    await store.put(cat);
                }
                await tx.done;

                let arr = [];
                clients.map((c) => (
                    arr.push({ value: c.id, label:  (c.name).toUpperCase() })
                ))

                setCustomers(arr);

                let arrProduct = [];
                products.map((c) => (
                    arrProduct.push({ value: c.id, label:  (c.name).toUpperCase(), price: c.price })
                ))

                setProducts(arrProduct);

                /* const tx_ = db.transaction(STORE_NAME_SUPPLIES, "readwrite");
                const store_ = tx_.objectStore(STORE_NAME_SUPPLIES);
                  
                await store_.clear();
                for (const supp of supplies) {
                    await store_.put(supp);
                }
                await tx_.done; */

                } else {
                    await loadLocalData();
                }
        } catch (err) {
            //alert("Impossible de charger les catégories");
            await loadLocalData();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      fetchData();
      window.addEventListener("online", syncPendingData);
      return () => window.removeEventListener("online", syncPendingData);
    }, []);

     return {
        customers,
        loading,
        error,
        addCustomer,
        orders,
        products,
        addOrder,
        isSubmitting
    };

}