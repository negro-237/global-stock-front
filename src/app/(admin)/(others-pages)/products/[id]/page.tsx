"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/../lib/api";
import { db } from "@/../lib/db";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";

export default function ProductDetailsPage() {

    const { id } = useParams(); // 🔹 récupère l'id depuis l'URL
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            let data: Product | null = null;

            if (navigator.onLine) {
                // 🔹 On tente d'abord de récupérer depuis l'API
                const res = await api.get(`/products/${id}`);
                data = res.data.data;
            } else {
                // 🔹 Si hors-ligne → lecture depuis IndexedDB
                const tx = db.transaction("products", "readonly");
                const store = tx.objectStore("products");
                const local = await store.get(String(id));
                await tx.done;
                data = local;
            }
            setProduct(data);
        } catch (err) {
            console.error("Erreur lors du chargement du produit :", err);
        } finally {
            setLoading(false);
        }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-6 text-gray-600">Chargement...</div>;

   if (!product)
    return (
      <div className="p-6 text-red-600">
        Produit introuvable ou non disponible hors ligne.
        <button
          onClick={() => router.back()}
          className="ml-4 text-blue-600 underline"
        >
          Retour
        </button>
      </div>
    );

    return (
        <div className="rounded-2xl border border-gray-200 space-y-10 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Details Produits
            </h3>

            <div className="rounded-2xl grid gap-4 grid-cols-2 border border-gray-200 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

                <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nom</label>
                    <Input 
                        value={product.category_name}
                        disabled
                        type="text" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                    />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Prix unitaire</label>
                    <Input 
                        value={String(product.price)}
                        disabled
                        type="text" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                    />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Categorie</label>
                    <Input 
                        value={product.category_name}
                        disabled
                        type="text" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                    />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Stock</label>
                    <Input 
                        value={String(product.quantity)}
                        disabled
                        type="text" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                    />
                </div>
                <div className="col-span-2">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                    <TextArea 
                        value={product.description}
                        disabled
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                    />
                </div>
            </div>
        </div>
    )

}