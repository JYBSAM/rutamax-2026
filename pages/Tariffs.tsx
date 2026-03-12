
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, DollarSign, ArrowRight, Package, Info, Loader2 } from 'lucide-react';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { currencyFormatter } from '../utils/helpers';
import { LOAD_TYPES } from '../constants';

const Tariffs: React.FC = () => {
  const { user } = useAuth();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTariff, setEditingTariff] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    originId: '',
    destinationId: '',
    loadType: 'general',
    amount: '',
    currency: 'CLP'
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tariffsData, destsData] = await Promise.all([
        supabaseService.getItems('tariffs', user!.companyId),
        supabaseService.getItems('destinations', user!.companyId)
      ]);
      setTariffs(tariffsData);
      setDestinations(destsData);
    } catch (error) {
      console.error('Error loading tariffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      originId: formData.originId,
      destinationId: formData.destinationId,
      loadType: formData.loadType,
      amount: Number(formData.amount),
      currency: formData.currency,
      companyId: user.companyId
    };

    try {
      if (editingTariff) {
        await supabaseService.updateItem('tariffs', editingTariff.id, payload);
      } else {
        await supabaseService.addItem('tariffs', payload as any);
      }
      loadData();
      setShowModal(false);
      setEditingTariff(null);
    } catch (error: any) {
      console.error('Error saving tariff:', error);
      alert(`Error al guardar tarifario: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este tarifario?')) {
      const success = await supabaseService.deleteItem('tariffs', id);
      if (success) {
        loadData();
      }
    }
  };

  const getDestName = (id: string) => destinations.find(d => d.id === id)?.name || 'N/A';

  const filteredTariffs = tariffs.filter(t => {
    const origin = getDestName(t.originId).toLowerCase();
    const dest = getDestName(t.destinationId).toLowerCase();
    return origin.includes(searchTerm.toLowerCase()) || dest.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
            <DollarSign size={22} className="text-primary" />
            Matriz de Tarifarios
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Configuración de precios base por ruta y carga</p>
        </div>
        <button 
          onClick={() => { setEditingTariff(null); setFormData({ originId: '', destinationId: '', loadType: 'general', amount: '', currency: 'CLP' }); setShowModal(true); }} 
          className="btn-primary"
        >
          <Plus size={16} /> Nuevo Tarifario
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Buscar por origen o destino..." 
          className="form-input pl-9 h-10 text-xs" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Sincronizando Tarifas...</p>
          </div>
        ) : filteredTariffs.length > 0 ? (
          filteredTariffs.map(tariff => (
          <div key={tariff.id} className="bg-card border border-border p-6 rounded-[2rem] space-y-6 group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Package size={20} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingTariff(tariff); setFormData(tariff); setShowModal(true); }} className="p-2 text-muted hover:text-white transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(tariff.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-[1px] h-4 bg-border"></div>
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-black text-white leading-none">{getDestName(tariff.originId)}</p>
                  <p className="text-sm font-black text-white leading-none">{getDestName(tariff.destinationId)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Carga: {LOAD_TYPES.find(l => l.id === tariff.loadType)?.name}</p>
                  <p className="text-2xl font-mono font-black text-primary">{currencyFormatter.format(tariff.amount)}</p>
                </div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Neto sugerido</div>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <div className="flex flex-col items-center gap-4 opacity-20">
              <Info size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">No hay tarifarios definidos para esta búsqueda</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">{editingTariff ? 'Editar Tarifario' : 'Nuevo Tarifario'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="form-label">Punto de Origen</label>
                <select required value={formData.originId} onChange={(e)=>setFormData({...formData, originId: e.target.value})} className="form-input">
                  <option value="">Seleccionar...</option>
                  {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label">Punto de Destino</label>
                <select required value={formData.destinationId} onChange={(e)=>setFormData({...formData, destinationId: e.target.value})} className="form-input">
                  <option value="">Seleccionar...</option>
                  {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label">Tipo de Carga</label>
                <select required value={formData.loadType} onChange={(e)=>setFormData({...formData, loadType: e.target.value})} className="form-input">
                  {LOAD_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label text-primary">Tarifa Neto ($)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    type="number" 
                    required 
                    value={formData.amount} 
                    onChange={(e)=>setFormData({...formData, amount: e.target.value})} 
                    className="form-input pl-10 font-bold text-primary font-mono" 
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Tarifario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tariffs;
