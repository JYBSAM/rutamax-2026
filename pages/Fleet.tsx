
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, X, Truck as TruckIcon, Calendar, Weight, Settings2, Gauge, Zap, Info, Layers, Trash2, Loader2 } from 'lucide-react';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { TRUCK_BRANDS, TRAILER_TYPES } from '../constants';
import AnalyticsHeader from '../components/ui/AnalyticsHeader';

const Fleet: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trucks' | 'trailers'>('trucks');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([
    { label: 'Disponibilidad Mecánica', value: '0%', trend: '0%', isUp: true, icon: Gauge, color: 'text-emerald-500' },
    { label: 'Antigüedad Promedio', value: '0 Años', trend: '0', isUp: true, icon: Calendar, color: 'text-blue-500' },
    { label: 'Factor de Carga Prom.', value: '0T', trend: '0T', isUp: true, icon: Weight, color: 'text-purple-500' },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    plate: '', brand: 'Volvo', model: '', year: '', axles: '', 
    maxLoadKg: '', capacityKg: '', status: 'available', fuelType: 'Diesel',
    type: 'sider'
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, activeTab, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trucks, trailers, trips] = await Promise.all([
        supabaseService.getItems<any>('trucks', user!.companyId),
        supabaseService.getItems<any>('trailers', user!.companyId),
        supabaseService.getItems<any>('trips', user!.companyId)
      ]);

      const currentItems = activeTab === 'trucks' ? trucks : trailers;
      setItems(currentItems);

      // Calculate Metrics
      const totalTrucks = trucks.length;
      const availableTrucks = trucks.filter(t => t.status === 'available').length;
      const availability = totalTrucks > 0 ? (availableTrucks / totalTrucks) * 100 : 0;

      const currentYear = new Date().getFullYear();
      const avgAge = trucks.length > 0 
        ? trucks.reduce((acc, t) => acc + (currentYear - (t.year || currentYear)), 0) / trucks.length 
        : 0;

      const avgLoad = activeTab === 'trucks' 
        ? (trucks.reduce((acc, t) => acc + (t.maxLoadKg || 0), 0) / (trucks.length || 1)) / 1000
        : (trailers.reduce((acc, t) => acc + (t.capacityKg || 0), 0) / (trailers.length || 1)) / 1000;

      setMetrics([
        { label: 'Disponibilidad Mecánica', value: `${availability.toFixed(1)}%`, trend: '+0.5%', isUp: true, icon: Gauge, color: 'text-emerald-500' },
        { label: 'Antigüedad Promedio', value: `${avgAge.toFixed(1)} Años`, trend: '-0.2', isUp: true, icon: Calendar, color: 'text-blue-500' },
        { label: 'Factor de Carga Prom.', value: `${avgLoad.toFixed(1)}T`, trend: '+1.2T', isUp: true, icon: Weight, color: 'text-purple-500' },
      ]);

      // Calculate Chart Data (Last 7 days)
      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push({
          date: d,
          name: days[d.getDay()],
          total: trucks.length,
          used: 0
        });
      }

      trips.forEach(trip => {
        if (!trip.scheduledStart) return;
        const tripDate = new Date(trip.scheduledStart);
        const day = last7Days.find(d => d.date.toDateString() === tripDate.toDateString());
        if (day && trip.status !== 'cancelled') {
          day.used++;
        }
      });

      setChartData(last7Days.map(({ name, total, used }) => ({
        name,
        total: total * 10, // Scale for visual impact in AreaChart
        used: used * 10
      })));

    } catch (error) {
      console.error('Error loading fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`¿Desea eliminar este activo (${activeTab})? Esto podría afectar historiales de viaje.`)) {
      const success = await supabaseService.deleteItem(activeTab, id);
      if (success) {
        loadData();
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const basePayload = { 
      plate: formData.plate,
      year: Number(formData.year),
      axles: Number(formData.axles),
      status: formData.status,
      companyId: user.companyId 
    };

    let payload: any = { ...basePayload };

    if (activeTab === 'trucks') {
      payload = {
        ...payload,
        brand: formData.brand,
        model: formData.model,
        fuelType: formData.fuelType,
        maxLoadKg: Number(formData.maxLoadKg),
        cameraUrl: formData.cameraUrl,
        hasVoice: formData.hasVoice
      };
    } else {
      payload = {
        ...payload,
        type: formData.type,
        capacityKg: Number(formData.capacityKg)
      };
    }

    console.log('Attempting to save:', { activeTab, payload });
    try {
      if (editingItem) {
        await supabaseService.updateItem(activeTab, editingItem.id, payload);
      } else {
        await supabaseService.addItem(activeTab, payload);
      }
      console.log('Save successful');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving fleet item:', error);
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i => i.plate.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-3 text-white">
            <TruckIcon size={22} className="text-primary" />
            Gestión de Activos
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Optimización de flota y capacidad de carga</p>
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ plate: '', brand: 'Volvo', model: '', year: '', axles: '', maxLoadKg: '', capacityKg: '', status: 'available', fuelType: 'Diesel', type: 'sider' }); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Nuevo {activeTab === 'trucks' ? 'Tracto' : 'Equipo'}
        </button>
      </div>

      <AnalyticsHeader 
        title="Utilización de Flota"
        subtitle="Capacidad operativa vs. uso real por tonelaje (%)"
        metrics={metrics}
        chartData={chartData}
        dataKeys={[
          { key: 'total', color: '#1f2937', name: 'Capacidad Total' },
          { key: 'used', color: '#3b82f6', name: 'Capacidad Utilizada' }
        ]}
      />

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex bg-[#111] p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('trucks')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'trucks' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}>Tractocamiones</button>
          <button onClick={() => setActiveTab('trailers')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'trailers' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}>Ramplas / Equipos</button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar patente..." className="form-input pl-9 h-10 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Cargando Activos...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 group relative hover:border-blue-500/20 transition-all overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <span className="font-mono font-black text-xl text-white tracking-tighter uppercase">{item.plate}</span>
                     <p className="text-[9px] font-black text-zinc-600 uppercase mt-1 tracking-[0.2em]">
                       {activeTab === 'trucks' ? `${item.brand} ${item.model}` : (TRAILER_TYPES.find(t => t.id === item.type)?.name || 'EQUIPO')}
                     </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${item.status === 'available' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500'}`}></div>
               </div>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                     <div className="flex items-center gap-2"><Weight size={14} className="text-zinc-600" /> {activeTab === 'trucks' ? item.maxLoadKg : item.capacityKg} KG</div>
                     <div className="flex items-center gap-2"><Settings2 size={14} className="text-zinc-600" /> {item.axles} EJES</div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                     <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} /> {activeTab === 'trucks' ? item.fuelType : 'EQUIPO LOGÍSTICO'}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="p-2 text-zinc-700 hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-500/30 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                     </div>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron activos</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Configuración de {activeTab === 'trucks' ? 'Tractocamión' : 'Rampla / Equipo'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 md:col-span-1">
                  <label className="form-label">Patente / Placa</label>
                  <input required value={formData.plate} onChange={(e)=>setFormData({...formData, plate: e.target.value.toUpperCase()})} className="form-input font-mono font-bold" placeholder="Ej: ABCD-12" />
                </div>

                {activeTab === 'trucks' ? (
                  <>
                    <div>
                      <label className="form-label">Marca</label>
                      <select required value={formData.brand} onChange={(e)=>setFormData({...formData, brand: e.target.value})} className="form-input">
                        {TRUCK_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">Modelo</label>
                      <input required value={formData.model} onChange={(e)=>setFormData({...formData, model: e.target.value})} className="form-input" placeholder="Ej: R450 Streamline / FH16" />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 md:col-span-1">
                    <label className="form-label">Tipo de Equipo / Carrocería</label>
                    <select value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})} className="form-input">
                      {TRAILER_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">Año Fabricación</label>
                  <input type="number" required value={formData.year} onChange={(e)=>setFormData({...formData, year: e.target.value})} className="form-input" placeholder="Ej: 2024" />
                </div>

                {activeTab === 'trucks' && (
                  <div>
                    <label className="form-label">Tipo de Combustible</label>
                    <select value={formData.fuelType} onChange={(e)=>setFormData({...formData, fuelType: e.target.value})} className="form-input">
                      <option value="Diesel">Diesel / Petróleo</option>
                      <option value="Electric">Eléctrico</option>
                      <option value="GNC">Gas Natural</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">{activeTab === 'trucks' ? 'Capacidad de Tracción (kg)' : 'Capacidad de Carga (kg)'}</label>
                  <input 
                    type="number" 
                    required 
                    value={activeTab === 'trucks' ? formData.maxLoadKg : formData.capacityKg} 
                    onChange={(e)=>setFormData({...formData, [activeTab === 'trucks' ? 'maxLoadKg' : 'capacityKg']: e.target.value})} 
                    className="form-input font-mono" 
                    placeholder="Ej: 30000"
                  />
                </div>

                <div>
                  <label className="form-label">Configuración de Ejes</label>
                  <input type="number" required value={formData.axles} onChange={(e)=>setFormData({...formData, axles: e.target.value})} className="form-input" placeholder="Ej: 3" />
                </div>

                {activeTab === 'trucks' && (
                  <>
                    <div className="col-span-2 border-t border-white/5 pt-8">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-4">Telemetría de Video (Opcional)</h3>
                    </div>
                    <div>
                      <label className="form-label">URL de Cámara (Stream)</label>
                      <input value={formData.cameraUrl || ''} onChange={(e)=>setFormData({...formData, cameraUrl: e.target.value})} className="form-input font-mono text-[10px]" placeholder="rtsp://... o http://..." />
                    </div>
                    <div className="flex items-center gap-4 pt-8">
                      <input type="checkbox" id="hasVoice" checked={formData.hasVoice || false} onChange={(e)=>setFormData({...formData, hasVoice: e.target.checked})} className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-500 focus:ring-brand-500" />
                      <label htmlFor="hasVoice" className="text-[10px] font-black uppercase tracking-widest text-white cursor-pointer">Habilitar Comunicación de Voz</label>
                    </div>
                  </>
                )}
                
                <div>
                   <label className="form-label">Estado Inicial</label>
                   <select value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})} className="form-input">
                      <option value="available">DISPONIBLE</option>
                      <option value="maintenance">EN TALLER</option>
                   </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="btn-ghost text-xs">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : `Guardar ${activeTab === 'trucks' ? 'Tracto' : 'Rampla'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
