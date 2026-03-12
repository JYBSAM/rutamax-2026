
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, X, Edit2, Timer, BarChart, AlertTriangle, Phone, Trash2, Loader2 } from 'lucide-react';
import { currencyFormatter, formatPhone } from '../utils/helpers';
import { CHILE_REGIONS } from '../constants';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import AnalyticsHeader from '../components/ui/AnalyticsHeader';

const Destinations: React.FC = () => {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDest, setEditingDest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '', address: '', region: 'Metropolitana', commune: '', contactName: '', contactPhone: '+569', price: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getItems('destinations', user!.companyId);
      setDestinations(data);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Lun', in: 45, out: 40 },
    { name: 'Mar', in: 52, out: 48 },
    { name: 'Mie', in: 60, out: 58 },
    { name: 'Jue', in: 48, out: 44 },
    { name: 'Vie', in: 65, out: 62 },
    { name: 'Sab', in: 30, out: 28 },
    { name: 'Dom', in: 10, out: 8 },
  ];

  const metrics = [
    { label: 'Tiempo de Espera (Dwell)', value: '38min', trend: '-5min', isUp: true, icon: Timer, color: 'text-emerald-500' },
    { label: 'Rotación de Andén', value: '4.2/h', trend: '+0.5', isUp: true, icon: BarChart, color: 'text-blue-500' },
    { label: 'Congestión Actual', value: 'Baja', trend: 'Estable', isUp: true, icon: AlertTriangle, color: 'text-amber-500' },
  ];

  const currentRegion = CHILE_REGIONS.find(r => r.name === formData.region);
  const communes = currentRegion ? currentRegion.communes : [];

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Desea eliminar este destino logístico?')) {
      const success = await supabaseService.deleteItem('destinations', id);
      if (success) {
        loadData();
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const payload = { 
      name: formData.name,
      address: formData.address,
      region: formData.region,
      commune: formData.commune,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      basePrice: Number(formData.price),
      companyId: user.companyId
    };
    
    try {
      if (editingDest) {
        await supabaseService.updateItem('destinations', editingDest.id, payload);
      } else {
        await supabaseService.addItem('destinations', payload as any);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving destination:', error);
      alert(`Error al guardar nodo: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredDestinations = destinations.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.commune.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-3 text-white">
            <MapPin size={22} className="text-primary" />
            Nodos Logísticos Maestro
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Gestión de puntos de transferencia y tarifas</p>
        </div>
        <button onClick={() => { setEditingDest(null); setFormData({ name: '', address: '', region: 'Metropolitana', commune: '', contactName: '', contactPhone: '+569', price: '' }); setShowModal(true); }} className="btn-primary text-xs font-black">
          <Plus size={16} /> Nuevo Nodo
        </button>
      </div>

      <AnalyticsHeader 
        title="Flujo de Carga Global"
        subtitle="Entradas vs Salidas de carga por día (Tonelaje)"
        metrics={metrics}
        chartData={chartData}
        dataKeys={[
          { key: 'in', color: '#3ecf8e', name: 'Entradas' },
          { key: 'out', color: '#6366f1', name: 'Salidas' }
        ]}
      />

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar nodo por nombre o comuna..." className="form-input pl-9 h-10 text-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Sincronizando Nodos...</p>
          </div>
        ) : filteredDestinations.length > 0 ? (
          filteredDestinations.map((dest) => (
            <div key={dest.id} className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 group relative hover:border-emerald-500/20 transition-all overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none">{dest.name}</h4>
                     <p className="text-[9px] font-black text-zinc-600 uppercase mt-2 tracking-widest">{dest.commune}, {dest.region}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingDest(dest); setFormData(dest); setShowModal(true); }} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(dest.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors bg-rose-500/5 rounded-lg"><Trash2 size={14} /></button>
                  </div>
               </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-black/40 p-3 rounded-xl border border-white/5">
                   <span className="text-zinc-500">Tarifa Nodo</span>
                   <span className="text-emerald-500 font-mono">{currencyFormatter.format(dest.price)}</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 font-black text-[10px]">{dest.contactName?.charAt(0)}</div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white uppercase tracking-tight">{dest.contactName}</span>
                      <span className="text-[8px] font-mono text-zinc-600 mt-0.5">{dest.contactPhone}</span>
                   </div>
                </div>
             </div>
          </div>
        ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron nodos logísticos</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Configuración de Nodo</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="form-label">Nombre del Nodo / Planta</label>
                  <input required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value.toUpperCase()})} className="form-input font-bold" placeholder="Ej: PLANTA MAIPU / CD QUILICURA" />
                </div>
                <div>
                   <label className="form-label">Región</label>
                   <select value={formData.region} onChange={(e)=>setFormData({...formData, region: e.target.value, commune: ''})} className="form-input">
                      {CHILE_REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label">Comuna</label>
                   <select required value={formData.commune} onChange={(e)=>setFormData({...formData, commune: e.target.value})} className="form-input">
                      <option value="">Seleccionar...</option>
                      {communes.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Dirección Exacta</label>
                  <input required value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} className="form-input" placeholder="Ej: AV. LOS PAJARITOS 1234" />
                </div>
                <div>
                  <label className="form-label">Nombre Contacto</label>
                  <input required value={formData.contactName} onChange={(e)=>setFormData({...formData, contactName: e.target.value})} className="form-input" placeholder="Ej: JOSE TORRES" />
                </div>
                <div>
                  <label className="form-label">Teléfono Contacto</label>
                  <input 
                    required 
                    value={formData.contactPhone} 
                    onChange={(e)=>setFormData({...formData, contactPhone: formatPhone(e.target.value)})} 
                    className="form-input" 
                    placeholder="+569 1234 5678" 
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="form-label">Tarifa Base ($)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={(e)=>setFormData({...formData, price: e.target.value})} 
                    className="form-input font-mono font-bold" 
                    placeholder="Ej: 160000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="btn-ghost text-xs">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px] text-xs font-black">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Nodo Logístico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Destinations;
