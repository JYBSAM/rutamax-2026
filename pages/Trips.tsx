
import React, { useState, useEffect, useRef } from 'react';
/* Added Layers to the lucide-react import list */
import { Plus, Search, Edit2, ArrowRight, Truck, User, Activity, Timer, Target, BarChart2, X, DollarSign, Camera, FileText, Trash2, Eye, MapPin, Package, Layers, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { currencyFormatter } from '../utils/helpers';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { LOAD_TYPES } from '../constants';
import AnalyticsHeader from '../components/ui/AnalyticsHeader';

const Trips: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<any>({
    otNumber: '', driverId: '', truckId: '', trailerId: '', originId: '', destinationId: '', 
    weightKg: '', loadType: 'general', fleteNeto: '', sealNumber: '', 
    scheduledStart: new Date().toISOString().split('T')[0],
    docImage: null
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsData, destsData, driversData, trucksData, trailersData, tariffsData] = await Promise.all([
        supabaseService.getItems('trips', user!.companyId),
        supabaseService.getItems('destinations', user!.companyId),
        supabaseService.getItems('drivers', user!.companyId),
        supabaseService.getItems('trucks', user!.companyId),
        supabaseService.getItems('trailers', user!.companyId),
        supabaseService.getItems('tariffs', user!.companyId)
      ]);
      
      setTrips(tripsData);
      setDestinations(destsData);
      setDrivers(driversData);
      setTrucks(trucksData);
      setTrailers(trailersData);
      setTariffs(tariffsData);

      // Calculate Metrics
      const completedTrips = tripsData.filter((t: any) => t.status === 'delivered');
      const onTimeTrips = completedTrips.filter((t: any) => {
        if (!t.actualStart || !t.scheduledStart) return false;
        return new Date(t.actualStart).getTime() <= new Date(t.scheduledStart).getTime();
      });
      const punctuality = completedTrips.length > 0 ? (onTimeTrips.length / completedTrips.length) * 100 : 0;

      let totalRevenue = 0;
      tripsData.forEach((t: any) => {
        totalRevenue += Number(t.fleteNeto || 0);
      });
      const avgRevenue = tripsData.length > 0 ? totalRevenue / tripsData.length : 0;

      setMetrics([
        { label: 'Tasa de Puntualidad', value: `${punctuality.toFixed(1)}%`, trend: '+2.1%', isUp: true, icon: Timer, color: 'text-emerald-500' },
        { label: 'Ciclo de Carga Prom.', value: '1.4h', trend: '-10min', isUp: true, icon: Target, color: 'text-blue-500' },
        { label: 'Revenue Promedio', value: currencyFormatter.format(avgRevenue), trend: '+4.5%', isUp: true, icon: BarChart2, color: 'text-purple-500' },
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
          prog: 0,
          real: 0
        });
      }

      tripsData.forEach((trip: any) => {
        if (!trip.scheduledStart) return;
        const tripDate = new Date(trip.scheduledStart);
        const day = last7Days.find(d => d.date.toDateString() === tripDate.toDateString());
        if (day) {
          day.prog++;
          if (trip.status === 'delivered') {
            day.real++;
          }
        }
      });

      setChartData(last7Days.map(({ name, prog, real }) => ({
        name,
        prog,
        real
      })));
    } catch (error) {
      console.error('Error loading trips data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [metrics, setMetrics] = useState<any[]>([
    { label: 'Tasa de Puntualidad', value: '0%', trend: '0%', isUp: true, icon: Timer, color: 'text-emerald-500' },
    { label: 'Ciclo de Carga Prom.', value: '0h', trend: '0', isUp: true, icon: Target, color: 'text-blue-500' },
    { label: 'Revenue/KM', value: '$0', trend: '0%', isUp: true, icon: BarChart2, color: 'text-purple-500' },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);

  const canCreateTrip = trucks.length > 0 && drivers.length > 0 && destinations.length >= 2;

  const filteredTrips = trips.filter(t => {
    const matchSearch = (t.otNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'PENDIENTE',
      'loading': 'CARGANDO',
      'in-transit': 'EN RUTA',
      'unloading': 'DESCARGANDO',
      'delivered': 'ENTREGADO',
      'cancelled': 'ANULADO',
      'suspended': 'SUSPENDIDO'
    };
    return map[status] || status.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'text-emerald-500';
      case 'in-transit': return 'text-blue-400';
      case 'pending': return 'text-amber-500';
      case 'cancelled': return 'text-red-500';
      case 'suspended': return 'text-rose-600 font-black animate-pulse';
      default: return 'text-zinc-400';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta Orden de Transporte? Esta acción no se puede deshacer.')) {
      const success = await supabaseService.deleteItem('trips', id);
      if (success) {
        loadData();
        setShowDetail(false);
      }
    }
  };

  useEffect(() => {
    if (formData.originId && formData.destinationId && formData.loadType) {
      const match = tariffs.find(t => 
        t.originId === formData.originId && 
        t.destinationId === formData.destinationId && 
        t.loadType === formData.loadType
      );
      if (match && !editingTrip) {
        setFormData(prev => ({ ...prev, fleteNeto: match.amount }));
      }
    }
  }, [formData.originId, formData.destinationId, formData.loadType, tariffs, editingTrip]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const payload = { 
      otNumber: formData.otNumber,
      driverId: formData.driverId,
      truckId: formData.truckId,
      trailerId: formData.trailerId,
      originId: formData.originId,
      destinationId: formData.destinationId,
      weightKg: Number(formData.weightKg),
      loadType: formData.loadType,
      fleteNeto: Number(formData.fleteNeto),
      sealNumber: formData.sealNumber,
      scheduledStart: formData.scheduledStart,
      docImageUrl: formData.docImage,
      companyId: user.companyId,
      status: editingTrip ? editingTrip.status : 'pending',
    };
    
    try {
      if (editingTrip) {
        await supabaseService.updateItem('trips', editingTrip.id, payload);
      } else {
        await supabaseService.addItem('trips', payload as any);
      }
      loadData();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving trip:', error);
      alert(`Error al guardar viaje: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (id: string, list: any[]) => list.find(l => l.id === id)?.plate || list.find(l => l.id === id)?.name || 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
            <Activity size={22} className="text-primary" />
            Consola de Tráfico
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Gestión de operaciones y logística en tiempo real</p>
        </div>
        <button 
          onClick={() => { 
            if (!canCreateTrip) return;
            setEditingTrip(null); 
            setFormData({ otNumber: '', driverId: '', truckId: '', trailerId: '', originId: '', destinationId: '', weightKg: '', loadType: 'general', fleteNeto: '', sealNumber: '', scheduledStart: new Date().toISOString().split('T')[0], docImage: null }); 
            setShowModal(true); 
          }} 
          className={`btn-primary ${!canCreateTrip ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          title={!canCreateTrip ? "Debes configurar activos y nodos antes de crear viajes" : ""}
        >
          <Plus size={16} /> Nueva OT
        </button>
      </div>

      {!canCreateTrip && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Configuración Crítica Requerida</h4>
              <p className="text-[11px] text-zinc-500 font-medium">No puedes emitir Ordenes de Transporte sin camiones, conductores y puntos de carga definidos.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Ver Guía de Inicio
          </button>
        </div>
      )}

      <AnalyticsHeader 
        title="Flujo de Operaciones"
        subtitle="Comparativa de viajes programados vs realizados por día"
        metrics={metrics}
        chartData={chartData}
        dataKeys={[
          { key: 'prog', color: '#10b981', name: 'Programados' },
          { key: 'real', color: '#3b82f6', name: 'Completados' }
        ]}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar por OT, camión o ruta..." className="form-input pl-9 h-10 text-xs" />
        </div>
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="form-input h-10 text-xs w-full md:w-48">
          <option value="all">TODOS LOS ESTADOS</option>
          <option value="pending">PENDIENTES</option>
          <option value="in-transit">EN RUTA</option>
          <option value="delivered">ENTREGADOS</option>
        </select>
      </div>

      <div className="hidden lg:block overflow-x-auto border border-white/5 rounded-2xl bg-[#0a0a0a] shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Sincronizando Operaciones...</p>
          </div>
        ) : (
          <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">OT / ESTADO</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">RUTA & CARGA</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">EQUIPO</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">TARIFA</th>
              <th className="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTrips.map(trip => (
              <tr 
                key={trip.id} 
                className="table-row group cursor-pointer"
                onClick={() => { setSelectedTrip(trip); setShowDetail(true); }}
              >
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm text-white group-hover:text-primary transition-colors">{trip.otNumber}</span>
                    <span className={`text-[9px] font-black uppercase mt-1 ${getStatusColor(trip.status)}`}>{translateStatus(trip.status)}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    {getLabel(trip.originId, destinations)} <ArrowRight size={12} className="text-zinc-600" /> {getLabel(trip.destinationId, destinations)}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">
                    {LOAD_TYPES.find(l => l.id === trip.loadType)?.name} • {trip.weightKg}KG
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold text-zinc-300">
                      <Truck size={12} className="text-zinc-600" /> {getLabel(trip.truckId, trucks)}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 uppercase font-black text-[9px]">
                      <User size={12} /> {getLabel(trip.driverId, drivers)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-mono font-bold text-white text-sm">{currencyFormatter.format(trip.fleteNeto)}</div>
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingTrip(trip); setFormData(trip); setShowModal(true); }} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(trip.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors bg-rose-500/5 rounded-lg"><Trash2 size={14} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!loading && filteredTrips.length === 0 && (
          <div className="py-20 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron operaciones</p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="py-10 flex flex-col items-center gap-4">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Cargando...</p>
          </div>
        ) : filteredTrips.length > 0 ? (
          filteredTrips.map(trip => (
          <div 
            key={trip.id} 
            onClick={() => { setSelectedTrip(trip); setShowDetail(true); }}
            className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] space-y-6 active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-black text-white tracking-tight">{trip.otNumber}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${getStatusColor(trip.status)}`}>{translateStatus(trip.status)}</p>
              </div>
              <div className="font-mono font-bold text-emerald-500">{currencyFormatter.format(trip.fleteNeto)}</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-[1px] h-4 bg-white/10"></div>
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-white leading-none">{getLabel(trip.originId, destinations)}</p>
                  <p className="text-xs font-bold text-white leading-none">{getLabel(trip.destinationId, destinations)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{getLabel(trip.truckId, trucks)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{getLabel(trip.driverId, drivers).split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="py-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron operaciones</p>
          </div>
        )}
      </div>

      {filteredTrips.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
          <div className="flex flex-col items-center gap-4 opacity-20">
            <Activity size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin operaciones registradas</p>
          </div>
        </div>
      )}

      {/* Modal Detalle de Viaje */}
      {showDetail && selectedTrip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-4xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-white/5 ${getStatusColor(selectedTrip.status)}`}>
                     <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Detalle Operación {selectedTrip.otNumber}</h2>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${getStatusColor(selectedTrip.status)}`}>{translateStatus(selectedTrip.status)}</p>
                  </div>
               </div>
               <button onClick={() => setShowDetail(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12 overflow-y-auto max-h-[75vh] scrollbar-hide">
               <div className="md:col-span-2 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ruta del Viaje</label>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                              <span className="text-sm font-black text-white">{getLabel(selectedTrip.originId, destinations)}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                              <span className="text-sm font-black text-white">{getLabel(selectedTrip.destinationId, destinations)}</span>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Detalle Financiero</label>
                        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                           <p className="text-2xl font-mono font-black text-emerald-500">{currencyFormatter.format(selectedTrip.fleteNeto)}</p>
                           <p className="text-[9px] font-black text-zinc-500 uppercase mt-2 tracking-widest">Tarifa Total Flete Neto</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                     <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                        <Truck size={16} className="text-zinc-500 mb-3" />
                        <p className="text-xs font-black text-white uppercase">{getLabel(selectedTrip.truckId, trucks)}</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">Tractocamión</p>
                     </div>
                     <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                        <Layers size={16} className="text-zinc-500 mb-3" />
                        <p className="text-xs font-black text-white uppercase">{getLabel(selectedTrip.trailerId, trailers)}</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">Rampla / Equipo</p>
                     </div>
                     <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                        <User size={16} className="text-zinc-500 mb-3" />
                        <p className="text-xs font-black text-white uppercase">{getLabel(selectedTrip.driverId, drivers)}</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">Conductor</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Evidencia Documental</label>
                  <div className="aspect-[4/5] bg-black border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center group relative">
                     {selectedTrip.docImage ? (
                        <img src={selectedTrip.docImage} alt="Documento" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                     ) : (
                        <div className="flex flex-col items-center gap-4 opacity-30">
                           <FileText size={48} />
                           <p className="text-[10px] font-black uppercase">Sin documento adjunto</p>
                        </div>
                     )}
                     {selectedTrip.docImage && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button className="btn-primary py-2 px-4 rounded-xl text-[9px]"><Eye size={12} /> Ver Tamaño Completo</button>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 bg-white/[0.01] border-t border-white/5 flex justify-between items-center">
               <div className="flex gap-4">
                  <button onClick={() => { setEditingTrip(selectedTrip); setFormData(selectedTrip); setShowModal(true); setShowDetail(false); }} className="btn-primary py-3 px-8 rounded-xl text-xs"><Edit2 size={16} /> Editar Registro</button>
                  <button onClick={() => handleDelete(selectedTrip.id)} className="btn-ghost py-3 px-8 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20"><Trash2 size={16} /> Eliminar</button>
               </div>
               <div className="flex items-center gap-2 text-zinc-600">
                  <MapPin size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Monitoreo GPS Activo</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Modal (Nuevo/Editar) */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">{editingTrip ? 'Editar Operación' : 'Nueva Orden de Carga'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="form-label">Nro. Orden de Transporte</label>
                  <input required value={formData.otNumber} onChange={(e)=>setFormData({...formData, otNumber: e.target.value.toUpperCase()})} className="form-input font-mono font-bold" placeholder="Ej: OT-7844" />
                </div>
                <div className="space-y-2">
                  <label className="form-label">Fecha Programada</label>
                  <input type="date" required value={formData.scheduledStart} onChange={(e)=>setFormData({...formData, scheduledStart: e.target.value})} className="form-input" />
                </div>

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

                <div className="col-span-full p-8 bg-white/[0.01] border border-white/5 rounded-[2rem] space-y-6">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Configuración de Tripulación y Activos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">Camión / Tracto</label>
                      <select required value={formData.truckId} onChange={(e)=>setFormData({...formData, truckId: e.target.value})} className="form-input">
                        <option value="">Seleccionar...</option>
                        {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Rampla</label>
                      <select required value={formData.trailerId} onChange={(e)=>setFormData({...formData, trailerId: e.target.value})} className="form-input">
                        <option value="">Seleccionar...</option>
                        {trailers.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Conductor</label>
                      <select required value={formData.driverId} onChange={(e)=>setFormData({...formData, driverId: e.target.value})} className="form-input">
                        <option value="">Seleccionar...</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
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
                  <label className="form-label">Peso de Carga (KG)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.weightKg} 
                    onChange={(e)=>setFormData({...formData, weightKg: e.target.value})} 
                    className="form-input font-mono" 
                    placeholder="Ej: 28000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="form-label text-primary">Tarifa Neto ($)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <input 
                      type="number" 
                      required 
                      value={formData.fleteNeto} 
                      onChange={(e)=>setFormData({...formData, fleteNeto: e.target.value})} 
                      className="form-input pl-10 font-bold text-primary font-mono" 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="col-span-full space-y-4">
                   <label className="form-label">Adjuntar Documento (Guía / POD)</label>
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] hover:bg-white/[0.03] hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                   >
                      {formData.docImage ? (
                        <div className="relative w-full h-full p-4">
                           <img src={formData.docImage} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                           <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, docImage: null}); }} className="absolute top-6 right-6 p-2 bg-red-500 rounded-lg text-white shadow-xl"><X size={14}/></button>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                             <Camera size={24} className="text-zinc-500" />
                          </div>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Click para cargar imagen del documento</p>
                        </>
                      )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setFormData({...formData, docImage: reader.result as string});
                       reader.readAsDataURL(file);
                     }
                   }} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
