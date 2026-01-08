"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/../lib/api";
import { getDb } from "@/../lib/db";

const STORE_NAME_CUSTOMERS = "customers";
const STORE_NAME_ORDERS = "orders";

export function useOrders() {
    const [customers, setCustomers] = useState<CustomerSeletctOption[]>([]);
    const [products, setProducts] = useState<ProductSelectOption[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadLocalData = useCallback(async () => {
        const db = await getDb();
        const tx = db.transaction(STORE_NAME_CUSTOMERS, "readonly");
        const store = tx.objectStore(STORE_NAME_CUSTOMERS);
        const all = await store.getAll();
        const arr = all.filter((c) => !c.deleted);
        const newArr: { value: string | number; label: string }[] = [];
        arr.map((c) => (
            newArr.push({ value: c.id, label: (c.name).toUpperCase() })
        ))
        
        setCustomers(newArr);
        await tx.done;

        const tx1 = db.transaction(STORE_NAME_ORDERS, "readonly");
        const store1 = tx1.objectStore(STORE_NAME_ORDERS);
        const all1 = await store1.getAll();
        const arr1 = all1.filter((c) => !c.deleted);
        setOrders(arr1);
        await tx1.done;
        setLoading(false);
    }, []);

    const addOrder = async (order: Omit<Order, "id" | "unsynced" | "deleted">) => {
        
        setIsSubmitting(true);
        const db = await getDb();
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

        const db = await getDb();
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

    const syncPendingData = useCallback(async () => {
        if (!navigator.onLine) return;  
        const db = await getDb();
        const allClients = await db.getAll(STORE_NAME_CUSTOMERS);
        const allOrders = await db.getAll(STORE_NAME_ORDERS);

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
                if (err && typeof err === "object" && "message" in err) {
                    console.error(`Sync échouée pour ${prod.name} (${(err as { message: string }).message})`);
                } else {
                    console.error(`Sync échouée pour ${prod.name} (Unknown error)`);
                }
            }
        }

        for (const order of allOrders) {
            if (!order.unsynced) continue;   
            try {
                if (order.deleted) {
                    // Suppression différée
                    await api.delete(`/orders/${order.id}`);
                    // Ouvre une nouvelle transaction après l'appel
                    const tx_ = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                    await tx_.store.delete(order.id);
                    await tx_.done;
                }
                else if (order.id.toString().startsWith("temp-")) {
                    // Produit local à synchroniser
                    const res = await api.post("/customers", order);
                    const tx_ = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                    await tx_.store.delete(order.id);
                    await tx_.store.put({ ...res.data.data, unsynced: false });
                    await tx_.done;
                }   
            } catch (err) {
                // @ts-expect-error error
                console.error(`Sync échouée pour ${order.name} (${err.message})`);
            }
        }

        await loadLocalData();
    }, [loadLocalData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (navigator.onLine) {
                const res = await api.get("/customers");
                const clients = res.data.data.customers;
                const products = res.data.data.products;
                const orders_ = res.data.data.orders;
                
                setOrders(orders_);

                const db = await getDb();
                const tx = db.transaction(STORE_NAME_CUSTOMERS, "readwrite");
                const store = tx.objectStore(STORE_NAME_CUSTOMERS);
        
                // Remplace les données locales
                await store.clear();
                for (const cat of clients) {
                    await store.put(cat);
                }
                await tx.done;

                const arr: { value: string | number; label: string }[] = [];
                clients.map((c: Customer) => (
                    arr.push({ value: c.id, label:  (c.name).toUpperCase() })
                ))

                setCustomers(arr);

                const arrProduct: { value: string | number; label: string; price: number, balance?: number }[] = [];
                
                products.map((c: Product) => (
                    arrProduct.push({ value: c.id, label:  (c.name).toUpperCase(), price: c.price, balance: c.balance })
                ))

                setProducts(arrProduct);

                const tx_ = db.transaction(STORE_NAME_ORDERS, "readwrite");
                const store_ = tx_.objectStore(STORE_NAME_ORDERS);
                  
                await store_.clear();
                for (const order of orders_) {
                    await store_.put(order);
                }
                await tx_.done;

                } else {
                    await loadLocalData();
                }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            //alert("Impossible de charger les catégories");
            await loadLocalData();
        } finally {
            setLoading(false);
        }
    }, [loadLocalData]);

    useEffect(() => {
      fetchData();
      window.addEventListener("online", syncPendingData);
      return () => window.removeEventListener("online", syncPendingData);
    }, [fetchData, syncPendingData]);

     return {
        customers,
        loading,
        error,
        addCustomer,
        orders,
        products,
        addOrder,
        isSubmitting,
        setError,
        setIsSubmitting
    };

}