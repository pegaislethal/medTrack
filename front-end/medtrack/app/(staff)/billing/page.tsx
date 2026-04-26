"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllMedicines, purchaseMedicine, type Medicine } from "@/lib/api/medicine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShoppingCart, Search, Plus, Minus, X, CheckCircle2, Eye, Receipt } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface CartItem extends Medicine {
  cartQuantity: number;
}

export default function BillingPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState({
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    prescription: "",
  });

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const setExactQuantity = (id: string, value: string, maxQty: number) => {
    if (value === "") {
      setCart((prev) => prev.map(item => 
        item._id === id ? { ...item, cartQuantity: 0 } : item
      ));
      return;
    }
    const newQty = parseInt(value);
    if (isNaN(newQty)) return;
    
    const finalQty = Math.min(Math.max(0, newQty), maxQty);
    setCart((prev) => prev.map(item => 
      item._id === id ? { ...item, cartQuantity: finalQty } : item
    ));
  };


  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const openCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // Validation
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!nameRegex.test(customerInfo.customerName)) {
      alert("Please enter a valid Customer Name (3-50 letters only).");
      return;
    }
    if (!phoneRegex.test(customerInfo.customerPhone)) {
      alert("Please enter a valid 10-digit Phone Number.");
      return;
    }

    if (customerInfo.customerAddress.length < 5) {
      alert("Please enter a more detailed address.");
      return;
    }
    if (cart.some(item => item.cartQuantity <= 0)) {
      alert("Some items in your cart have 0 quantity. Please update or remove them.");
      return;
    }

    setIsCheckingOut(true);

    try {
      for (const item of cart) {
        await purchaseMedicine(item._id, item.cartQuantity, customerInfo);
      }
      setShowCheckoutModal(false);
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
    setCustomerInfo({ customerName: "", customerAddress: "", customerPhone: "", prescription: "" });
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
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-slate-900 line-clamp-1 pr-6">{med.medicineName}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedMedicine(med); setShowDetailsModal(true); }}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1 -mt-1 -mr-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
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
                    <input 
                      type="number"
                      value={item.cartQuantity === 0 ? "" : item.cartQuantity}
                      onChange={(e) => setExactQuantity(item._id, e.target.value, item.quantity)}
                      onBlur={() => {
                        if (item.cartQuantity <= 0) {
                          removeFromCart(item._id);
                        }
                      }}
                      className="w-10 text-center text-sm font-medium bg-transparent text-white border-none focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none p-0"
                    />

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
            className="w-full py-6 text-lg rounded-xl gap-2"
            disabled={cart.length === 0}
            onClick={openCheckout}
          >
            <Receipt className="w-5 h-5" />
            Proceed to Checkout
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

      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Checkout Details">
        <form onSubmit={handleCheckout} className="space-y-4">
          <p className="text-sm text-slate-500">Record customer details for this transaction.</p>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Customer Name</label>
            <Input 
              required 
              value={customerInfo.customerName} 
              onChange={e => {
                const val = e.target.value;
                if (val === "" || /^[a-zA-Z\s]*$/.test(val)) {
                  setCustomerInfo({...customerInfo, customerName: val});
                }
              }} 
              placeholder="e.g. John Doe (Letters only)" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Customer Phone</label>
            <Input 
              required 
              value={customerInfo.customerPhone} 
              onChange={e => {
                const val = e.target.value;
                if ((val === "" || /^[0-9]*$/.test(val)) && val.length <= 10) {
                  setCustomerInfo({...customerInfo, customerPhone: val});
                }
              }} 
              placeholder="e.g. 9800000000 (10 digits only)" 
              maxLength={10}
            />

          </div>


          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <Input required value={customerInfo.customerAddress} onChange={e => setCustomerInfo({...customerInfo, customerAddress: e.target.value})} placeholder="e.g. Kathmandu, Nepal" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Prescription Reference <span className="text-slate-400 font-normal">(Optional)</span></label>
            <Input value={customerInfo.prescription} onChange={e => setCustomerInfo({...customerInfo, prescription: e.target.value})} placeholder="Dr. Name / Rx Code" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 flex justify-between items-center">
             <span className="text-slate-600 font-medium">Total Payable Amount</span>
             <span className="text-xl font-bold text-indigo-700">Rs {cartTotal.toFixed(2)}</span>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCheckoutModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCheckingOut}>Complete Purchase</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Medicine Details">
        {selectedMedicine && (
          <div className="space-y-4 text-sm mt-2">
            {selectedMedicine.image?.url ? (
               <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  <img src={selectedMedicine.image.url} alt="Medicine" className="w-full h-full object-cover" />
               </div>
            ) : (
               <div className="w-full h-32 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400">
                 No Image Available
               </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Name</p>
                <p className="font-semibold text-slate-900">{selectedMedicine.medicineName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Category</p>
                <p className="font-semibold text-slate-900">{selectedMedicine.category}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Manufacturer</p>
                <p className="font-semibold text-slate-900">{selectedMedicine.manufacturer}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Expiry Date</p>
                <p className="font-semibold text-slate-900">{new Date(selectedMedicine.expiryDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 font-medium text-xs uppercase mb-1">Description</p>
                <p className="text-slate-700">{selectedMedicine.description || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
