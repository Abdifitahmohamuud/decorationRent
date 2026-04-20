"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  MoreVertical,
  X
} from "lucide-react";

interface Decoration {
  id: string;
  name: string;
  description: string;
  image: string | null;
  price: number;
  priceUnitHours: number;
  totalQty: number;
  availableQty: number;
  isActive: boolean;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Decoration | null>(null);

  const fetchItems = async () => {
    const params = new URLSearchParams({ search });
    const res = await fetch(`/api/admin/decorations?${params.toString()}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This will permanently remove it from the system.")) return;
    const res = await fetch(`/api/admin/decorations/${id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
    else {
      const error = await res.json();
      alert(error.error || "Delete failed. If this item was ever booked, you must hide it instead of deleting it.");
    }
  };

  const toggleStatus = async (item: Decoration) => {
    const res = await fetch(`/api/admin/decorations/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive })
    });
    if (res.ok) fetchItems();
  };

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Management</h1>
          <p className="text-gray-500 font-medium">Control your decoration assets, stock levels, and pricing.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search decorations..." 
               className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-72 shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>
      </header>

      {/* Low Stock Warning */}
      {items.some(item => item.availableQty <= 2) && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-[1.5rem] flex items-center space-x-3 text-amber-700 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-bold">Attention: Some items are running low on stock. Please restock soon.</p>
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-[2rem] h-80 animate-pulse" />
          ))
        ) : items.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden group hover:border-indigo-100 transition duration-300 flex flex-col">
            <div className="h-48 bg-gray-50 relative overflow-hidden">
               {item.image ? (
                 <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                   <ImageIcon className="w-12 h-12" />
                 </div>
               )}
               <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                    className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200 hover:text-indigo-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
               <div className="absolute bottom-4 left-4">
                  <StatusBadge isActive={item.isActive} onToggle={() => toggleStatus(item)} />
               </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-extrabold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition truncate pr-4">{item.name}</h3>
                 <span className="font-extrabold text-indigo-600 whitespace-nowrap text-right ml-2">${item.price} <span className="text-xs text-gray-400 font-medium block">/ {item.priceUnitHours === 1 ? 'hr' : `${item.priceUnitHours} hrs`}</span></span>
               </div>
               <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{item.description}</p>
               
               <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Stock Level</p>
                    <p className={`font-extrabold ${item.availableQty <= 2 ? 'text-amber-500' : 'text-gray-900'}`}>{item.availableQty} / {item.totalQty}</p>
                 </div>
                 <div className="w-24 bg-gray-50 rounded-full h-1.5 flex overflow-hidden">
                   <div className={`${item.availableQty <= 2 ? 'bg-amber-400' : 'bg-indigo-400'} h-full rounded-full`} style={{ width: `${(item.availableQty / item.totalQty) * 100}%` }} />
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <DecorationModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchItems(); }} 
        />
      )}
    </div>
  );
}

function StatusBadge({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-all shadow-lg backdrop-blur-md ${
        isActive 
          ? "bg-emerald-500/90 text-white border-emerald-400" 
          : "bg-rose-500/90 text-white border-rose-400"
      }`}
    >
      {isActive ? "Online / Available" : "Offline / Hidden"}
    </button>
  );
}

function DecorationModal({ item, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    priceUnitHours: item?.priceUnitHours || 1,
    totalQty: item?.totalQty || 1,
    image: item?.image || "",
    isActive: item?.isActive ?? true,
    availableQty: item?.availableQty || 0
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const url = item ? `/api/admin/decorations/${item.id}` : "/api/admin/decorations";
    const method = item ? "PATCH" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        price: Number(formData.price),
        priceUnitHours: Number(formData.priceUnitHours),
        totalQty: Number(formData.totalQty)
      })
    });

    if (res.ok) onSuccess();
    else alert("You make some thing of wrong, try again later");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {item ? "Edit Decoration" : "Add Decoration"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500 border border-transparent hover:border-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Decoration Name</label>
              <input 
                required
                type="text" 
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Description</label>
               <textarea 
                required
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Price ($)</label>
               <input 
                required
                type="number" 
                step="0.01"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Price Duration (Hours)</label>
               <input 
                required
                type="number" 
                step="1"
                min="1"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
                value={formData.priceUnitHours}
                onChange={(e) => setFormData({...formData, priceUnitHours: Number(e.target.value)})}
               />
            </div>

             <div className="space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"> AvailableQty ($)</label>
               <input 
                required
                type="number" 
                step="0.01"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
                value={formData.availableQty}
                onChange={(e) => setFormData({...formData, availableQty: Number(e.target.value)})}
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Initial Stock</label>
               <input 
                required
                type="number" 
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-gray-900"
                value={formData.totalQty}
                onChange={(e) => setFormData({...formData, totalQty: Number(e.target.value)})}
               />
            </div>

            <div className="col-span-2 space-y-2">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Decoration Image</label>
               <div className="flex items-center space-x-4">
                 <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                   {formData.image ? (
                     <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                   ) : <ImageIcon className="w-8 h-8" />}
                 </div>
                 <div className="flex-grow">
                   <input 
                    type="file" 
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, image: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                   />
                   <p className="text-[10px] text-gray-500 mt-2 font-medium">PNG, JPG or WEBP. Max 2MB recommended.</p>
                 </div>
               </div>
            </div>
            
            <div className="col-span-2 flex items-center space-x-3 pt-4">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500/20 border-gray-200"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Display this item in the catalog</label>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 flex items-center space-x-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98]"
            >
              {item ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
