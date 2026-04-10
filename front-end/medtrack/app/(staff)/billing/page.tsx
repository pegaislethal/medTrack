"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllMedicines, purchaseMedicine, type Medicine } from "@/lib/api/medicine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShoppingCart, Search, Plus, Minus, X, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface CartItem extends Medicine {
  cartQuantity: number;
}

export default function BillingPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await getAllMedicines();
      if (response.success && response.data) {
        setMedicines(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMedicines = useMemo(() => {
    if (!search) return medicines;
    const lower = search.toLowerCase();
    return medicines.filter((m) => 
      m.medicineName.toLowerCase().includes(lower) ||
      m.batchNumber.toLowerCase().includes(lower)
    );
  }, [medicines, search]);

  const addToCart = (med: Medicine) => {
    setCart((prev) => {
      const existing = prev.find(item => item._id === med._id);
      if (existing) {
        if (existing.cartQuantity >= med.quantity) return prev; // Cannot exceed stock
        return prev.map(item => item._id === med._id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      if (med.quantity <= 0) return prev; // Out of stock
      return [...prev, { ...med, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item._id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.quantity) return item;
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      // Assuming sequential purchasing for multiple items
      // In a real system you'd have a batch endpoint.
      for (const item of cart) {
        await purchaseMedicine(item._id, item.cartQuantity);
      }
      setShowReceipt(true);
      fetchMedicines(); // Refresh stock
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const finishCheckout = () => {
    setCart([]);
    setShowReceipt(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Left: Inventory */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Medicines</h2>
          <Input 
            isSearch 
            placeholder="Search for medicines..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMedicines.map(med => {
              const inCart = cart.find(c => c._id === med._id)?.cartQuantity || 0;
              const isOutOfStock = med.quantity <= 0;
              
              return (
                <div 
                  key={med._id} 
                  onClick={() => addToCart(med)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer select-none
                    ${isOutOfStock ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                    ${inCart > 0 ? 'ring-2 ring-indigo-600 border-transparent shadow-sm' : ''}
                  `}
                >
                  {inCart > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                      {inCart}
                    </div>
                  )}
                  <div className="font-semibold text-slate-900 line-clamp-1">{med.medicineName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Batch: {med.batchNumber}</div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm font-bold text-indigo-700">Rs {med.price.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : 'text-slate-500'}`}>
                      {isOutOfStock ? 'Out of Stock' : `Stock: ${med.quantity}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Current Order</h2>
          <div className="ml-auto bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {cart.length} items
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-100">{item.medicineName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Rs {item.price.toFixed(2)} / unit</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
                    <button 
                      onClick={() => updateQuantity(item._id, -1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.cartQuantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, 1)}
                      className="p-1 text-slate-400 hover:text-white"
                      disabled={item.cartQuantity >= item.quantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-semibold text-indigo-300">
                    Rs {(item.price * item.cartQuantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Total Amount</span>
            <span className="text-2xl font-bold">Rs {cartTotal.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full py-6 text-lg rounded-xl"
            disabled={cart.length === 0 || isCheckingOut}
            isLoading={isCheckingOut}
            onClick={handleCheckout}
          >
            Checkout & Pay
          </Button>
        </div>
      </div>

      <Modal isOpen={showReceipt} onClose={finishCheckout} title="Sale Complete">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Payment Successful</h3>
          <p className="text-sm text-slate-500 mt-1">Receipt for MedTrack Transaction</p>
          
          <div className="mt-6 bg-slate-50 rounded-xl p-4 text-left border border-slate-100">
            <div className="space-y-3 mb-4 border-b border-slate-200 pb-4">
              {cart.map(item => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">
                    {item.cartQuantity}x {item.medicineName}
                  </span>
                  <span className="text-slate-900 font-semibold">
                    Rs {(item.price * item.cartQuantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="text-xl font-bold text-slate-900">Rs {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full mt-6" onClick={finishCheckout}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
