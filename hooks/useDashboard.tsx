"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/../lib/api";
import { getDb } from "@/../lib/db";

const STORE_NAME_PRODUCTS = "products";
const STORE_NAME_ORDERS = "orders";

export function useDashboard() {

    const [products, setProducts] = useState(0);
    const [orders, setOrders] = useState(0);
    const [sales, setSales] = useState([]);
    const [months, setMonths] = useState([]);
    const [lastOrders, setLastOrders] = useState<Order[]>([]);

    const fetchData = useCallback(async () => {
        const loadLocalData = async () => {
            const db = await getDb();
            const tx = db.transaction(STORE_NAME_PRODUCTS, "readonly");
            const store = tx.objectStore(STORE_NAME_PRODUCTS);
            const all = await store.getAll();
            //console.log(all.length);
            setProducts(all.length);
            await tx.done;

            const tx_ = db.transaction(STORE_NAME_ORDERS, "readonly");
            const store_ = tx_.objectStore(STORE_NAME_ORDERS);
            const all_ = await store_.getAll();
            //console.log("iiiiiii", all_.length);
            setOrders(all_.length);
            await tx_.done;

            try {
                const salesData = localStorage.getItem("sales");
                if(salesData) setSales(JSON.parse(salesData));
                const monthsData = localStorage.getItem("months");
                if(monthsData) setMonths(JSON.parse(monthsData));
                const productsData = localStorage.getItem("products");
                if(productsData) setProducts(JSON.parse(productsData));
                const ordersData = localStorage.getItem("orders");
                if(ordersData) setOrders(JSON.parse(ordersData));
                const recentsData = localStorage.getItem("recents");
                if(recentsData) setLastOrders(JSON.parse(recentsData));
            } catch (error) {
                console.error("Erreur lors de la récupération des données locales du tableau de bord :", error);
            }
        }

        try {
            if (navigator.onLine) {
                const res = await api.get("/dashboard");
                const data = res.data.data;
                setSales(data.sales);
                setMonths(data.months);
                setProducts(data.products);
                setOrders(data.orders);
                setLastOrders(data.recents_orders);
                localStorage.setItem("sales", JSON.stringify(data.sales));
                localStorage.setItem("months", JSON.stringify(data.months));
                localStorage.setItem("products", JSON.stringify(data.products));
                localStorage.setItem("orders", JSON.stringify(data.orders));
                localStorage.setItem("recents", JSON.stringify(data.recents_orders));
            } else {
                await loadLocalData();
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des données du tableau de bord :", error);
        }
    }, []);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    return {
        products,
        orders,
        sales,
        months,
        lastOrders
    }
}