"use client";
import * as React from "react";
import { useState, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { PlusIcon, CloseLineIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { useOrders } from "../../../../../../hooks/useOrders";
import { Modal } from "@/components/ui/modal";
import Alert from "@/components/ui/alert/Alert";
import TextArea from "@/components/form/input/TextArea";

export default function OrdersPage() {
    const [selectedClient, setSelectedClient] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const { 
        loading,
        customers,
        addCustomer,
        products,
        addOrder,
        error,
        isSubmitting,
        setError,
        setIsSubmitting
    } = useOrders();

    const [orderItems, setOrderItems] = useState([
        { product_id: "", quantity: "" },
    ]);

    const addNewLine = () => {
        setOrderItems([...orderItems, { product_id: "", quantity: "" }]);
    };

    const removeLine = (index: number) => {
        setOrderItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        setOrderItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const handleCustomerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if(!name) {
            setError('Veuillez remplir les champs obligatoires');
            return ;
        }

        const added = await addCustomer({ name, phone, address });
        if(!added) {
            setError('error');
            return;
        }

        setName('');
        setPhone('');
        setAddress('');
        setOpenModal(false);
        setIsSubmitting(false);
    }

    const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>)  => {
        e.preventDefault();
        
        const added = await addOrder({ customer_id: selectedClient, products: orderItems });
       
        if(!added) {
            return;
        }
    }

    // 🧮 Calcul dynamique de la facture
    const invoice = useMemo(() => {
        let total = 0;
        const lines = orderItems
            .map((item) => {
                const prod = products.find((p) => String(p.id) === String(item.product_id));
                if (!prod || !item.quantity) return null;
                const subtotal = Number(item.quantity) * Number(prod.price || 0);
                total += subtotal;
                return {
                    name: prod.name,
                    quantity: item.quantity,
                    price: prod.price,
                    subtotal
                };
            })
            .filter(Boolean);
        return { lines, total };
    }, [orderItems, products]);

    if (loading) return <div className="p-6 text-gray-600">Chargement...</div>;

    return (
        <div className="rounded-2xl border border-gray-200 space-y-10 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Nouvelle commande
            </h3>

            <div className="grid grid-cols-3 gap-4 p-4 md:p-5">
                {/* === FORMULAIRE DE COMMANDE === */}
                <form className="col-span-3 order-2 md:order-1 md:col-span-2" onSubmit={handleOrderSubmit}>
                    <div className="grid gap-4 grid-cols-2 border p-5 lg:p-6">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">Client</label>
                                <div 
                                    className="cursor-pointer font-medium text-gray-900 dark:text-white"
                                    onClick={() => setOpenModal(true)}
                                >
                                    <PlusIcon />
                                </div>
                            </div>
                            <Select
                                // @ts-expect-error error
                                options={customers}
                                placeholder="Sélectionner le client"
                                onChange={(value) => setSelectedClient(value)}   
                            />
                        </div>

                        {/* === LIGNES PRODUITS === */}
                        {orderItems.map((item, index) => (
                            <React.Fragment key={index}>
                                <div className="col-span-2 sm:col-span-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                            Produit #{index + 1}
                                        </label>
                                        {index === orderItems.length - 1 && (
                                            <div
                                                onClick={addNewLine}
                                                className="cursor-pointer font-medium text-gray-900 dark:text-white"
                                            >
                                                <PlusIcon />
                                            </div>
                                        )}
                                    </div>
                                    <Select
                                        // @ts-expect-error error
                                        options={products}
                                        placeholder="Sélectionner un produit"
                                        onChange={(value) => updateItem(index, "product_id", value)}
                                    />
                                </div>

                                <div className="col-span-2 sm:col-span-1 flex items-end gap-2">
                                    <div className="flex-1">
                                        <label htmlFor={`qty-${index}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Quantité
                                        </label>
                                        <Input
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                            type="number"
                                            id={`qty-${index}`}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            required
                                            placeholder="Ex: 3"
                                        />
                                    </div>

                                    {index > 0 && (
                                        <div
                                            onClick={() => removeLine(index)}
                                            className="flex justify-center items-center cursor-pointer text-gray-700 dark:text-white"
                                        >
                                            <CloseLineIcon />
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}

                        <div className="col-span-2 flex justify-end">
                            <Button
                                disabled={isSubmitting}
                                type="submit" 
                                className="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            >
                                {isSubmitting ? "Ajout en cours ..." : "Ajouter la commande"}   
                            </Button>
                        </div>
                    </div>
                </form>

                {/* === FACTURE DYNAMIQUE === */}
                <div className="col-span-3 order-1 md:order-2 md:col-span-1 border p-5 rounded-lg bg-white dark:bg-gray-800">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">🧾 Facture</h4>
                    {selectedClient ? (
                        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                            Client : <strong>{customers.find(c => String(c.id) === String(selectedClient))?.name}</strong>
                        </p>
                    ) : (
                        <p className="text-sm mb-4 text-gray-500 italic">Aucun client sélectionné</p>
                    )}

                    {invoice.lines.length > 0 ? (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-300 dark:border-gray-700">
                                    <th className="text-left py-2">Produit</th>
                                    <th className="text-right py-2">Qté</th>
                                    <th className="text-right py-2">Prix</th>
                                    <th className="text-right py-2">Sous-total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((line, i) => (
                                    line && (
                                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                                            <td>{line.name}</td>
                                            <td className="text-right">{line.quantity}</td>
                                            <td className="text-right">{Number(line.price).toLocaleString()} FCFA</td>
                                            <td className="text-right">{Number(line.subtotal).toLocaleString()} FCFA</td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-semibold border-t border-gray-300 dark:border-gray-700">
                                    <td colSpan={3} className="text-right py-2">Total</td>
                                    <td className="text-right text-blue-600 dark:text-blue-400">
                                        {invoice.total.toLocaleString()} FCFA
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Aucun produit ajouté pour l’instant.</p>
                    )}
                </div>
            </div>

            {/* === MODAL AJOUT CLIENT === */}
            <Modal isOpen={openModal} onClose={() => setOpenModal(false)} showCloseButton={false}>
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Ajouter un client
                        </h3>
                        <button onClick={() => setOpenModal(false)} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="p-3">
                            <Alert variant="error" title="Erreur" message="Erreur lors de l'ajout du client" />
                        </div>
                    )}

                    <form className="p-4 md:p-5" onSubmit={handleCustomerSubmit}>
                        <div className="grid gap-4 mb-4 grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nom</label>
                                <Input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text" 
                                    id="name" 
                                    required 
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Téléphone</label>
                                <Input 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    type="text" 
                                    id="phone"
                                    placeholder="672089620"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Adresse</label>
                                <TextArea 
                                    value={address}
                                    onChange={(e) => setAddress(e)}
                                    placeholder="Douala, bepanda..."
                                />
                            </div>

                            <div className="col-span-2 flex justify-end">
                                <Button disabled={isSubmitting} type="submit">
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
