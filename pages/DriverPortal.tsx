
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Navigation, X, Check, ArrowRight, CheckCircle2,
  LayoutDashboard, History, Trophy, Volume2
} from 'lucide-react';
import { useAuth } from '../App';
import { realtimeService } from '../utils/realtimeService';
import { supabaseService } from '../utils/supabaseService';
import { Trip } from '../types';
import { Loader2 } from 'lucide-react';

const CHECKLIST_CONFIG = [
  { id: 'frenos', label: 'Frenos de Aire', critical: true },
  { id: 'neumaticos', label: 'Estado Neumáticos', critical: true },
  { id: 'luces', label: 'Luces de Freno/Giro', critical: true },
  { id: 'motor', label: 'Niveles de Aceite/Agua', critical: false },
];

const DriverPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'mission' | 'history' | 'stats'>('mission');
  const [viewState, setViewState] = useState<'main' | 'checklist' | 'driving' | 'summary'>('main');
  const [checklistResults, setChecklistResults] = useState<Record<string, 'ok' | 'fail' | null>>({});
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const [driverData, setDriverData] = useState<any>(null);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (user?.id && user?.companyId) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    setLoading(true);
    try {
      const [trips, drivers] = await Promise.all([
        supabaseService.getItems<any>('trips', user!.companyId),
        supabaseService.getItems<any>('drivers', user!.companyId)
      ]);
      
      const myTrips = trips.filter((t: any) => t.driverId === user!.id);
      setAssignedTrips(myTrips);
      
      const currentDriver = drivers.find((d: any) => d.id === user!.id || d.rut === user!.rut);
      setDriverData(currentDriver);
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((msg) => {
      if (msg.payload.driverId === user?.id) {
        if (msg.type === 'ADMONISHMENT') {
          setNotification({
            title: msg.payload.title,
            message: msg.payload.message
          });
        } else if (msg.type === 'TRIP_SUSPENDED') {
          setNotification({
            title: 'VIAJE SUSPENDIDO',
            message: msg.payload.reason
          });
          setViewState('main');
        }
        
        // Refresh driver data to show new rating or lock status
        if (user?.companyId) {
          loadDriverData();
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  const activeTrip = assignedTrips.find(t => ['pending', 'loading', 'in-transit', 'unloading'].includes(t.status));
  const historyTrips = assignedTrips.filter(t => t.status === 'delivered' || t.status === 'cancelled' || t.status === 'suspended');

  if (driverData?.isLocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center space-y-8">
        <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
          <Volume2 size={48} className="animate-pulse" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter">ACCESO BLOQUEADO</h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
            Tu rendimiento ha caído por debajo del límite de seguridad permitido (50%). 
            Por protocolo de seguridad crítica, tu cuenta ha sido suspendida.
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl w-full max-w-xs">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tu Score Actual</p>
          <p className="text-4xl font-black text-red-500">{driverData.performanceRating}%</p>
        </div>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Contacta a tu supervisor para revisión</p>
        <button onClick={logout} className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest">Cerrar Sesión</button>
      </div>
    );
  }

  useEffect(() => {
    if (viewState === 'driving' && activeTrip) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, speed, heading } = pos.coords;
            realtimeService.publish('LOCATION_UPDATE', {
              truckId: activeTrip.truckId,
              lat: latitude,
              lng: longitude,
              speed: (speed || 0) * 3.6,
              heading,
              driver: user?.name
            }, user?.id);
          },
          (err) => console.error("Error GPS:", err),
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );
      }
    } else if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [viewState, activeTrip]);

  if (viewState === 'checklist') {
    return (
      <div className="min-h-screen bg-black text-white p-6 pb-32">
        <header className="mb-10 flex items-center justify-between">
          <button onClick={() => setViewState('main')} className="p-3 bg-white/5 rounded-2xl"><X size={20} /></button>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Seguridad Pre-Ruta</h2>
          <div className="w-10"></div>
        </header>
        <div className="max-w-md mx-auto space-y-4">
           {CHECKLIST_CONFIG.map(item => (
             <div key={item.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                <div>
                   <p className="font-bold text-sm text-white">{item.label}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setChecklistResults({...checklistResults, [item.id]: 'ok'})} className={`w-12 h-12 rounded-2xl flex items-center justify-center ${checklistResults[item.id] === 'ok' ? 'bg-[#3ecf8e] text-black' : 'bg-white/5 text-slate-600'}`}><Check size={20} /></button>
                   <button onClick={() => setChecklistResults({...checklistResults, [item.id]: 'fail'})} className={`w-12 h-12 rounded-2xl flex items-center justify-center ${checklistResults[item.id] === 'fail' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-600'}`}><X size={20} /></button>
                </div>
             </div>
           ))}
           <button 
             disabled={Object.keys(checklistResults).length < CHECKLIST_CONFIG.length}
             onClick={() => setViewState('driving')}
             className="w-full bg-[#3ecf8e] text-black font-black py-6 rounded-3xl text-xs uppercase tracking-widest mt-10 shadow-2xl disabled:opacity-20"
           >
              Validar e Iniciar Ruta
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-6 bg-[#0a0a0a]/80 backdrop-blur-3xl border-b border-white/5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-[#3ecf8e] rounded-2xl flex items-center justify-center text-black font-black text-lg">{user?.name.charAt(0)}</div>
           <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Empresa ID: {user?.companyId}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                {driverData?.performanceRating !== undefined && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${driverData.performanceRating > 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {driverData.performanceRating}%
                  </span>
                )}
              </div>
           </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${viewState === 'driving' ? 'bg-[#3ecf8e] animate-pulse' : 'bg-slate-700'}`}></div>
      </header>

      {notification && (
        <div className="fixed inset-x-6 top-24 z-[200] bg-red-600 text-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(220,38,38,0.5)] animate-in slide-in-from-top-8">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Volume2 size={16} /> {notification.title}
            </h4>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
          </div>
          <p className="text-sm font-bold leading-tight">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="mt-4 w-full py-3 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Entendido</button>
        </div>
      )}

      <main className="flex-1 p-6 pb-32 space-y-6 max-w-xl mx-auto w-full">
        {activeTab === 'history' ? (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Historial de Viajes</h3>
            {historyTrips.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center">
                <p className="text-slate-500 text-xs font-bold uppercase">Sin viajes finalizados</p>
              </div>
            ) : (
              historyTrips.map(trip => (
                <div key={trip.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-white">{trip.otNumber || 'S/N'}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{new Date(trip.scheduledStart).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${
                        trip.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {trip.status === 'delivered' ? 'Entregado' : trip.status === 'suspended' ? 'Suspendido' : 'Anulado'}
                      </span>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{trip.originName || 'Origen'}</span>
                      <ArrowRight size={12} />
                      <span>{trip.destinationName || 'Destino'}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'stats' ? (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] space-y-8">
               <div className="text-center space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Tu Rendimiento Global</p>
                  <h3 className="text-6xl font-black text-white tracking-tighter">{driverData?.performanceRating ?? 100}%</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-3xl text-center">
                     <p className="text-2xl font-black text-white">{driverData?.admonishments?.length || 0}</p>
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Amonestaciones</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl text-center">
                     <p className="text-2xl font-black text-emerald-500">A+</p>
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Categoría</p>
                  </div>
               </div>
            </div>

            {driverData?.admonishments && driverData.admonishments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Historial de Amonestaciones</h4>
                {driverData.admonishments.map((adm: any) => (
                  <div key={adm.id} className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{adm.reason}</p>
                      <p className="text-[9px] text-slate-500 mt-1">{new Date(adm.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-red-500 font-black text-xs">-{adm.severity === 'critical' ? '15' : '5'}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !activeTrip ? (
          <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center space-y-6">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Navigation size={32} />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase">Sin misiones</h3>
                <p className="text-slate-500 text-xs">Esperando que la central de control te asigne un nuevo viaje.</p>
             </div>
          </div>
        ) : viewState === 'main' ? (
          <div className="bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 space-y-10">
             <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asignación Actual</h3>
                <p className="text-2xl font-black text-white tracking-tight">{activeTrip.otNumber || activeTrip.id}</p>
             </div>
             <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="w-2 h-2 rounded-full bg-[#3ecf8e] mt-1.5"></div>
                   <p className="text-sm font-bold text-white">{activeTrip.originName || activeTrip.origin}</p>
                </div>
                <div className="flex gap-4">
                   <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                   <p className="text-sm font-bold text-white">{activeTrip.destinationName || activeTrip.dest}</p>
                </div>
             </div>
             <button onClick={() => setViewState('checklist')} className="w-full bg-[#3ecf8e] text-black font-black py-6 rounded-3xl text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                Aceptar y Realizar Checklist <ArrowRight size={18} />
             </button>
          </div>
        ) : viewState === 'driving' ? (
          <div className="bg-[#0d0d0d] border border-[#3ecf8e]/30 rounded-[3rem] p-10 text-center space-y-10">
             <div className="w-24 h-24 bg-[#3ecf8e]/10 rounded-full flex items-center justify-center mx-auto border border-[#3ecf8e]/20">
                <Navigation className="text-[#3ecf8e] animate-pulse" size={40} />
             </div>
             <h3 className="text-2xl font-black text-white uppercase">En Ruta</h3>
             <button onClick={() => setViewState('summary')} className="w-full bg-orange-500 text-black font-black py-6 rounded-3xl text-xs uppercase tracking-widest">Reportar Llegada</button>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center space-y-10">
             <CheckCircle2 size={48} className="text-[#3ecf8e] mx-auto" />
             <h3 className="text-2xl font-black text-white uppercase">¡Viaje Finalizado!</h3>
             <button onClick={() => setViewState('main')} className="w-full bg-white text-black font-black py-6 rounded-3xl text-xs uppercase tracking-widest">Volver al Inicio</button>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-6 right-6 z-[100] max-w-md mx-auto">
         <nav className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2.5 flex justify-between items-center shadow-2xl">
            <button onClick={() => { setActiveTab('mission'); setViewState('main'); }} className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-[1.8rem] ${activeTab === 'mission' ? 'bg-white text-black' : 'text-slate-500'}`}><LayoutDashboard size={20} /><span className="text-[8px] font-black uppercase">Misión</span></button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-[1.8rem] ${activeTab === 'history' ? 'bg-white text-black' : 'text-slate-500'}`}><History size={20} /><span className="text-[8px] font-black uppercase">Historial</span></button>
            <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-[1.8rem] ${activeTab === 'stats' ? 'bg-white text-black' : 'text-slate-500'}`}><Trophy size={20} /><span className="text-[8px] font-black uppercase">Logros</span></button>
            <button onClick={logout} className="flex-1 flex flex-col items-center gap-1 py-3.5 text-red-500/50"><LogOut size={20} /><span className="text-[8px] font-black uppercase">Salir</span></button>
         </nav>
      </div>
    </div>
  );
};

export default DriverPortal;
