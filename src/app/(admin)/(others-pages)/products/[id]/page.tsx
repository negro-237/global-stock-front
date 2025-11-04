"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { useProducts } from "@/../hooks/useProducts";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getPaginationRowModel } from '@tanstack/react-table';
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Alert from "@/components/ui/alert/Alert";

export default function ProductDetailsPage() {

    const { id } = useParams(); // 🔹 récupère l'id depuis l'URL
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [quantity, setQuantity] = useState<number | null>(null);
    const [openSupplyModal, setOpenSupplyModal] = useState(false);
    const [error, setError] = useState<string | null>();
    const { 
        product, 
        supplies, 
        setProduct,
        showProduct,
        loading,
        addSupply
    } = useProducts();

     const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 10, //default page size
    });

    // Filtrer les catégories côté client selon la recherche
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return supplies;
        return supplies.filter(supp =>
            supp.quantity == Number(search)
        );
    }, [supplies, search]);
    
    const columnHelper = createColumnHelper<Supply>();
     const columns = [
        columnHelper.accessor("id", {
            header: "#",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.row.index + 1}</span>,
        }),
        columnHelper.accessor("quantity", {
            header: "Quantité",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        }),
        columnHelper.accessor("created_at", {
            header: "Date",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        })
    ];

    const table = useReactTable({ 
        data: filteredProducts, 
        columns, 
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        //manualPagination: true, 
        rowCount: filteredProducts.length,
        onPaginationChange: setPagination, //update the pagination state when internal APIs mutate the pagination state
        state: {
        //...
            pagination,
        },
    });

    const handleSupplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
    
            if (quantity && quantity > 0) {
                // determine product id as a validated string
                let productId: string;
                if (Array.isArray(id)) {
                    if (id.length === 0 || !id[0]) {
                        setError('error');
                        return;
                    }
                    productId = String(id[0]);
                } else {
                    if (!id) {
                        setError('error');
                        return;
                    }
                    productId = String(id);
                }
    
                // Appeler l'API pour faire l'approvisionnement
                const added = await addSupply({ product_id: productId, quantity });
                console.log('response', added)
                if(!added) {
                    setError('error');
                    return;
                }
                if(product && product.quantity) { 
                    const qty = product.quantity + quantity;
                    setProduct({...product, quantity: qty});
                }
                
                setQuantity(null);
                setOpenSupplyModal(false);
            }
        };

    useEffect(() => {
        if (!id) return;
        let productId: string;
        if (Array.isArray(id)) {
            if (id.length === 0) return;
            productId = id[0];
        } else {
            productId = id;
        }
        showProduct(productId);
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

            <div className="flex justify-end">
                <Button 
                    size="sm" 
                    onClick={() => {
                        setOpenSupplyModal(true);
                        setQuantity(null);
                    }}
                >
                    Approvisionner
                </Button>
            </div>

            <table className="min-w-full text-left border-collapse border border-gray-300">
                <thead className="bg-gray-100 dark:bg-gray-800">
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-2 border-b border-gray-300">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                    ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2 border-b border-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <Button 
                    size="sm" 
                    onClick={() => table.previousPage()} 
                    disabled={!table.getCanPreviousPage()}
                >
                    Précédent
                </Button>
                <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                <Button 
                    size="sm" 
                    onClick={() => table.nextPage()} 
                    disabled={!table.getCanNextPage()}
                >
                    Suivant
                </Button>
            </div>

             {/* Modal d'ajout et d'approvisionnement */}
            <Modal 
                isOpen={openSupplyModal}
                onClose={() => setOpenSupplyModal(false)}
                showCloseButton={false}
            >
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Faire un approvisionnement
                        </h3>
                        <button onClick={() => setOpenSupplyModal(false)} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="crud-modal">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>

                    {error && ((
                        <div className="p-3">
                            <Alert variant="error" title="erreur" message="Erreur lors de l'approvisionnement" />
                        </div>
                    ))}
            
                    <form className="p-4 md:p-5" onSubmit={handleSupplySubmit}>
                        <div className="grid gap-4 mb-4 grid-cols-2">
                            <div className="col-span-2">
                                <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Quantité</label>
                                <Input 
                                    value={quantity !== null ? quantity.toString() : ""}
                                    onChange={(e) => setQuantity(e.target.value === "" ? null : Number(e.target.value))}
                                    type="number" 
                                    id="quantity" 
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"  
                                    required 
                                    placeholder="Ex: 12"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <Button type="submit" className="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )

}