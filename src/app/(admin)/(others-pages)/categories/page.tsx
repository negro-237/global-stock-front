"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getPaginationRowModel } from '@tanstack/react-table'
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useCategories } from "@/../hooks/useCategories";
import { Modal } from "@/components/ui/modal";

export default function Categories() {

    const [openModal, setOpenModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>();
    const { categories, loading, addCategory, deleteCategory, error } = useCategories();

    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
      pageIndex: 0, //initial page index
      pageSize: 5, //default page size
    });

    // Filtrer les catégories côté client selon la recherche
    const filteredCategories = useMemo(() => {
      if (!search.trim()) return categories;
      return categories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      );
    }, [categories, search]);
    
    const columnHelper = createColumnHelper<Category>();
    const columns = [
      columnHelper.accessor("id", {
        header: "#",
        cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.row.index + 1}</span>,
      }),
      columnHelper.accessor("name", {
        header: "Nom",
        cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <Button className="bg-red-500 text-white" size="sm" onClick={() => { setOpenModal(true); setCategoryToDelete(info.row.original.id) }}>🗑 Supprimer</Button>
        ),
      }),
    ];

    const table = useReactTable({ 
      data: filteredCategories, 
      columns, 
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      //manualPagination: true, 
      rowCount: filteredCategories.length,
      onPaginationChange: setPagination, //update the pagination state when internal APIs mutate the pagination state
      state: {
        //...
        pagination,
      },
    });

    const handleAdd = async () => {
      if (name.trim()) {
        const added = await addCategory(name);
        if (!added) {
          console.log("Cette catégorie existe déjà !");
        } else {
          setName("");
        }
      }
    };

    const handleDelete = async () => {
      if(categoryToDelete) {
        await deleteCategory(categoryToDelete);
        setCategoryToDelete(null);
        setOpenModal(false);
      }
    };

    if (loading) return <p>Chargement des catégories...</p>;
    
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 space-y-10 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col justify-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Categories
          </h3>
          <div className="flex flex-col justify-between items-center gap-3 border border-gray-200 p-3 rounded-lg dark:border-gray-800 lg:flex-row">
            <div className="flex flex-row justify-between items-center gap-3 border border-gray-200 p-3 rounded-lg dark:border-gray-800">
              <Input 
                  placeholder="Nouvelle catégorie" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="min-w-[300px]"
                  error={error ? true : false}
                  hint={error}
                />
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={handleAdd}
                >
                  Ajouter
                </Button>
            </div>
            <div>
              <Input 
                placeholder="Rechercher..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-[200px]"
              />
            </div>
          </div>
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
