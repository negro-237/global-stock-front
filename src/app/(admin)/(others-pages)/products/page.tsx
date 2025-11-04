"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getPaginationRowModel } from '@tanstack/react-table';
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useProducts } from "@/../hooks/useProducts";
import { useCategories } from "@/../hooks/useCategories";
import { Modal } from "@/components/ui/modal";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import {useRouter} from "next/navigation";

export default function Products() {

    const router = useRouter();
    const [edit, setEdit] = useState(false);
    const [openFormModal, setFormOpenModal] = useState(false);
    const [openSupplyModal, setOpenSupplyModal] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>();
    const [selectedName, setSelectedName] = useState("");
    const { 
        products, 
        loading, 
        addProduct, 
        deleteProduct, 
        addSupply,
        editProduct
    } = useProducts();
    const { categories } = useCategories();
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const [name, setName] = useState("");
    const [category_id, setCategoryId] = useState("");
    const [price, setPrice] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number | null>(null);
    const [description, setDescription] = useState("");
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>();

    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 5, //default page size
    });

    // Filtrer les catégories côté client selon la recherche
    const filteredProducts = useMemo(() => {
      if (!search.trim()) return products;
      return products.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      );
    }, [products, search]);
    
    const columnHelper = createColumnHelper<Product>();
    const columns = [
        columnHelper.accessor("id", {
            header: "#",
            cell: (info) => <span className="text-gray-800  dark:text-white/90">{info.row.index + 1}</span>
        }),
        columnHelper.accessor("name", {
                header: "Nom",
                cell: (info) => (
                <span 
                    onClick={() => router.push(`/products/${info.row.original.id}`)}
                    className="text-gray-800 cursor-pointer hover:underline dark:text-white/90"
                >
                    {info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("price", {
            header: "Prix Unitaire",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        }),
        columnHelper.accessor("category_name", {
            header: "Categorie",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        }),
        columnHelper.accessor("quantity", {
            header: "Stock",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: (info) => (
                <div className="flex gap-2">
                    <Button className="bg-red-500 hover:bg-red-700" size="sm" onClick={() => { setOpenModal(true); setProductToDelete(info.row.original.id) }}>🗑 Supprimer</Button>
                    <Button size="sm" onClick={() => { setOpenSupplyModal(true); setSelectedName(info.row.original.name); setProductToDelete(info.row.original.id); setError(null); setQuantity(null)}}>Approvisionner</Button>
                    <Button 
                        size="sm" 
                        onClick={() => { 
                            const prod = info.row.original;
                            setFormOpenModal(true); 
                            setEdit(true);
                            setProductToEdit(prod);
                            setName(prod.name);
                            setCategoryId(String(prod.category_id));
                            setPrice(prod.price);
                            setQuantity(prod.quantity);
                            setDescription(prod.description || "");
                            setFormOpenModal(true);
                        }}
                    >
                            Editer
                    </Button>
                </div>
            ),
        }),
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!name.trim() || !category_id || !price) return;

        if (edit && productToEdit) {
            // 🔄 Mode édition
            const updated = await editProduct(productToEdit.id, {
                name,
                category_id,
                price,
                description,
            });
            if (updated) {
                setEdit(false);
                setProductToEdit(null);
                setFormOpenModal(false);
            }
        } else {
            // ➕ Mode création
            const added = await addProduct({
                name,
                category_id,
                price,
                description,
                quantity: quantity || 0,
            });

            if (added) {
                setName("");
                setPrice(null);
                setCategoryId("");
                setDescription("");
                setQuantity(null);
                setFormOpenModal(false);
            }
        }
    };

    const handleSupplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (quantity && quantity > 0) {
            // Appeler l'API pour faire l'approvisionnement
            const added = await addSupply({ product_id: productToDelete !== null && productToDelete !== undefined ? String(productToDelete) : "", quantity });
            if(!added) {
                setError('error');
                return;
            }
            setQuantity(null);
            setProductToDelete(null);
            setSelectedName("");
            setOpenSupplyModal(false);
        }
    };

    const handleDelete = async () => {
      //if(categoryToDelete) {

        /* const hasProducts = await checkCategoryHasProducts(categoryToDelete);
        if (hasProducts) {
          alert("Impossible de supprimer cette catégorie : elle contient des produits.");
          setOpenModal(false);
          setCategoryToDelete(null);
          return;
        } */

        await deleteProduct(productToDelete);
        setProductToDelete(null);
        setOpenModal(false);
      //}
    };

    if (loading) return <p className="font-semibold text-gray-800 dark:text-white/90">Chargement des produits...</p>;

    return (
        <div>
            <div className="rounded-2xl border border-gray-200 space-y-10 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Produits
                </h3>

                <div className="rounded-2xl border border-gray-200 space-y-5 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                    
                    <div className="flex justify-between items-center">
                        <Button 
                            size="sm"
                            onClick={() => setFormOpenModal(true)}
                        >
                            Ajouter
                        </Button>
                        <Input 
                            placeholder="Rechercher..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-[200px]"
                        />
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
                </div>
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
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nom du produit</label>
                                <Input 
                                    value={selectedName}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                                    disabled={true}
                                />
                            </div>
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

            {/* Modal d'ajout et d'édition */}
            <Modal 
                isOpen={openFormModal}
                onClose={() => {
                    setFormOpenModal(false);
                    setEdit(false);
                    setProductToEdit(null);
                    setName("");
                    setCategoryId("");
                    setPrice(null);
                    setQuantity(null);
                    setDescription("");
                }}
                showCloseButton={false}
            >
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {edit ? "Modifier le produit" : "Ajouter un nouveau produit"}
                        </h3>
                        <button onClick={() => setFormOpenModal(false)} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="crud-modal">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>
            
                    <form className="p-4 md:p-5" onSubmit={handleSubmit}>
                        <div className="grid gap-4 mb-4 grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nom</label>
                                <Input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    id="name"
                                    type="text" 
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                                    placeholder="Ex: Bronze"  
                                    required
                                />
                            </div>
                            {!edit && ((
                                <div className="col-span-2 sm:col-span-1">
                                    <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Stock Initial</label>
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
                            ))}
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Prix Unitaire</label>
                                <Input 
                                    value={price !== null ? price.toString() : ""}
                                    onChange={(e) => setPrice(e.target.value === "" ? null : Number(e.target.value))}
                                    type="number" 
                                    id="price" 
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"  
                                    required 
                                    placeholder="Ex: 1200"
                                />
                            </div>
                            <div className={edit ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                                <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Categorie</label>
                                <select 
                                    id="category" 
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                    value={category_id}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    <option>Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                                <TextArea 
                                    value={description}
                                    onChange={(e) => setDescription(e)}
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                    placeholder="Description du produit...">
                                </TextArea>                    
                            </div>
                        </div>
                        <Button type="submit" className="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            <svg className="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
                            Ajouter
                        </Button>
                    </form>
                </div>
            </Modal>

            {/* Modal de confirmation de suppression */}
            <Modal 
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                showCloseButton={false}
            >
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    <div className="p-4 md:p-5 text-center">
                        <svg className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Voulez vous vraiment supprimer ce produit?</h3>
                        <button onClick={handleDelete} data-modal-hide="popup-modal" type="button" className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                        Oui, Supprimer
                        </button>
                        <button onClick={() => setOpenModal(false)} data-modal-hide="popup-modal" type="button" className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                        Non, Annuler
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
     );
}