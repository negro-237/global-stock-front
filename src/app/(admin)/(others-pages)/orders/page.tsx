"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getPaginationRowModel } from '@tanstack/react-table';
import { useOrders } from "@/../hooks/useOrders";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {useRouter} from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
export default function OrdersPage() {

    const [client, setClient] = useState('');
    const [amount, setAmount] = useState('');
    const [created, setCreated] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<OrderItem[]>([]);
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [displayDetailModal, setDisplayDetailModal] = useState(false);
    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 5, //default page size
    });

    const { 
            orders,
            loading
        } = useOrders();

    const columnHelper = createColumnHelper<Order>();
    const columns = [
        columnHelper.accessor("id", {
            header: "#",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.row.index + 1}</span>
        }),
        columnHelper.accessor("client", {
                header: "Client",
                cell: (info) => (
                <span className="text-gray-800 dark:text-white/90">
                    {info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("amount", {
            header: "Montant",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()} FCFA</span>,
        }),
        columnHelper.accessor("created_at", {
            header: "Date création",
            cell: (info) => <span className="text-gray-800 dark:text-white/90">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: (info) => (
                <Button
                    size="sm"
                    onClick={() => {
                        const row = info.row.original;
                        setClient(row.client);
                        setAmount(row.amount);
                        setCreated(row.created_at);
                        setDisplayDetailModal(true);
                        setSelectedProduct(row.products);
                    }}
                >
                    Details
                </Button>
            )
        }),
    ];

    const filteredProducts = useMemo(() => {
        if (!search.trim()) return orders;
        return orders.filter(o =>
            o.client.toLowerCase().includes(search.toLowerCase())
        );
    }, [orders, search]);

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

    if (loading) return <p className="font-semibold text-gray-800 dark:text-white/90">Chargement des commandes...</p>;

    return (
        <div>
            <div className="rounded-2xl border border-gray-200 space-y-10 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Commandes
                </h3>

                <div className="rounded-2xl border border-gray-200 space-y-5 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                    
                    <div className="flex justify-between items-center">
                        <Button 
                            size="sm"
                            onClick={() => router.push('orders/new')}
                        >
                            Nouvelle commande
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

            <Modal
                isOpen={displayDetailModal}
                onClose={() => setDisplayDetailModal(false)}
                showCloseButton={false}
            >
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Détails commande
                        </h3>
                        <button onClick={() => setDisplayDetailModal(false)} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="crud-modal">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>

                    <div className="grid gap-4 mb-4 grid-cols-2 p-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Client</label>
                            <Input
                                disabled
                                value={client}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"  
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Montant</label>
                            <Input
                                disabled
                                value={amount}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"  
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date création</label>
                            <Input
                                disabled
                                value={created}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"  
                            />
                        </div>
                    </div>

                    <div className="max-w-full overflow-x-auto p-3">
                        <Table>
                            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                <TableRow>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Nom
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Quantité
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        PU
                                    </TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {selectedProduct.map((p, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{p.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{p.quantity}</TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{p.pu}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                </div>
            </Modal>
        </div>
    )
}