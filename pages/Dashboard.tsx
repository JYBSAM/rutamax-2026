
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Truck as TruckIcon, Activity, Navigation2, Layers, Users, Map as MapIcon, 
  TrendingUp, Clock, AlertCircle, ChevronRight, Zap, Target, Box, Gauge,
  CheckCircle2, ArrowRight, ShieldCheck, MapPin, Video, Mic, Volume2, X, Play, Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../utils/supabaseService';
import { realtimeService } from '../utils/realtimeService';
import { useAuth } from '../App';
import { Role } from '../types';
import Card from '../components/ui/Card';
import { Loader2 } from 'lucide-react';

const createTruckIcon = (plate: string, status: string, isSpeeding: boolean = false) => {
  const color = isSpeeding ? '#ef4444' : (status === 'available' ? '#3ecf8e' : status === 'on-trip' ? '#3b82f6' : '#ef4444');
  const pulseClass = isSpeeding ? 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : '';
  
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div class="flex items-center gap-2 bg-[#101010] border ${isSpeeding ? 'border-red-500' : 'border-[#2e2e2e]'} rounded-full px-3 py-1 shadow-2xl ${pulseClass}">
        <div class="w-1.5 h-1.5 rounded-full" style="background: ${color}"></div>
        <span class="text-[10px] font-mono font-bold text-white tracking-tighter">${plate}</span>
        ${isSpeeding ? '<div class="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>' : ''}
      </div>
    `,
    iconSize: [100, 30],
    iconAnchor: [50, 15]
  });
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [counts, setCounts] = useState({ trucks: 0, trailers: 0, drivers: 0, trips: 0, destinations: 0 });
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const isSuperMonitor = user?.role === Role.SUPER_MONITOR;
      const targetCompanyId = isSuperMonitor ? 'all' : user!.companyId;

      const [trucks, trailers, drivers, allTrips, destinations] = await Promise.all([
        supabaseService.getItems<any>('trucks', targetCompanyId),
        supabaseService.getItems<any>('trailers', targetCompanyId),
        supabaseService.getItems<any>('drivers', targetCompanyId),
        supabaseService.getItems<any>('trips', targetCompanyId),
        supabaseService.getItems<any>('destinations', targetCompanyId)
      ]);

      const activeTrips = allTrips.filter((t: any) => t.status !== 'delivered');

      setCounts({
        trucks: trucks.length,
        trailers: trailers.length,
        drivers: drivers.length,
        trips: activeTrips.length,
        destinations: destinations.length
      });

      if (trucks.length === 0 && drivers.length === 0) {
        setShowWelcome(true);
      }

      const mapReadyVehicles = trucks.map((v: any) => {
        const activeTrip = activeTrips.find((t: any) => t.truckId === v.id);
        return {
          ...v,
          pos: v.lastLocation ? [v.lastLocation.lat, v.lastLocation.lng] : [-33.44 + (Math.random() * 0.1), -70.65 + (Math.random() * 0.1)],
          speed: v.lastLocation?.speed || (v.status === 'on-trip' ? 60 + Math.random() * 30 : 0),
          loadType: activeTrip?.loadType || 'none',
          isSpeeding: false
        };
      });
      setVehicles(mapReadyVehicles);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simulation loop for real-time movement and speed monitoring
  useEffect(() => {
    if (vehicles.length === 0) return;

    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status !== 'on-trip') return v;

        // Simulate small movement
        const newLat = v.pos[0] + (Math.random() - 0.5) * 0.001;
        const newLng = v.pos[1] + (Math.random() - 0.5) * 0.001;
        
        // Simulate speed fluctuation
        let newSpeed = v.speed + (Math.random() - 0.5) * 5;
        if (newSpeed < 40) newSpeed = 40;
        if (newSpeed > 110) newSpeed = 110;

        // Speed limit check for dangerous goods (IMO)
        const speedLimit = v.loadType === 'imo' ? 80 : 100;
        const isSpeeding = newSpeed > speedLimit;

        if (isSpeeding && !v.isSpeeding) {
          // Trigger alert
          const newAlert = {
            id: `alert_${Date.now()}`,
            plate: v.plate,
            speed: Math.round(newSpeed),
            limit: speedLimit,
            time: new Date().toLocaleTimeString(),
            type: v.loadType === 'imo' ? 'CRÍTICO: CARGA PELIGROSA' : 'EXCESO DE VELOCIDAD'
          };
          setAlerts(current => [newAlert, ...current].slice(0, 5));

          // Apply penalty to driver
          if (user?.companyId) {
            const handleViolation = async () => {
              const trips = await supabaseService.getItems<any>('trips', user.companyId);
              const activeTrip = trips.find((t: any) => t.truckId === v.id && t.status === 'in-transit');
              if (activeTrip && activeTrip.driverId) {
                const penalty = v.loadType === 'imo' ? 15 : 5;
                await supabaseService.penalizeDriver(
                  activeTrip.driverId, 
                  user.companyId, 
                  penalty, 
                  `Exceso de velocidad en ruta (${Math.round(newSpeed)} km/h)`
                );

                // Notify the driver via realtime service
                realtimeService.publish('ADMONISHMENT', {
                  driverId: activeTrip.driverId,
                  title: 'ALERTA DE SEGURIDAD',
                  message: `Has excedido el límite de velocidad (${Math.round(newSpeed)} km/h). Se ha aplicado una amonestación a tu registro.`,
                  penalty
                }, 'system');

                // If IMO and speeding, suspend trip immediately
                if (v.loadType === 'imo') {
                  await supabaseService.updateItem<any>('trips', activeTrip.id, { status: 'suspended' });
                  realtimeService.publish('TRIP_SUSPENDED', {
                    driverId: activeTrip.driverId,
                    tripId: activeTrip.id,
                    reason: 'Violación crítica de velocidad con Carga Peligrosa (IMO). Viaje suspendido por seguridad.'
                  }, 'system');
                }
              }
            };
            handleViolation();
          }
        }

        return {
          ...v,
          pos: [newLat, newLng],
          speed: newSpeed,
          isSpeeding
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [vehicles.length, user?.companyId]);

  const stats = [
    { label: 'Tractocamiones', val: counts.trucks, icon: TruckIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Viajes Activos', val: counts.trips, icon: Navigation2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Conductores', val: counts.drivers, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Soporte Cloud', val: 'Sync', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ];

  const setupSteps = [
    { id: 'trucks', label: 'Registrar Tractos', count: counts.trucks, path: '/flota', icon: TruckIcon },
    { id: 'drivers', label: 'Enrolar Conductores', count: counts.drivers, path: '/conductores', icon: Users },
    { id: 'destinations', label: 'Definir Nodos/Destinos', count: counts.destinations, path: '/destinos', icon: MapPin },
  ];

  const isSetupComplete = counts.trucks > 0 && counts.drivers > 0 && counts.destinations >= 2;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#2e2e2e] pb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Target size={18} className="text-primary" />
            Consola Operativa
          </h1>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.2em] mt-1">
            {user?.role === Role.SUPER_MONITOR ? 'CENTRO DE CONTROL MAESTRO' : (user?.companyData?.businessName || 'Empresa Activa')} • Nodo Central
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === Role.SUPER_MONITOR && (
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 px-4 py-2 rounded-lg shadow-inner">
              <ShieldCheck size={14} className="text-brand-500" />
              <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Servicio de Monitoreo Activo</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#171717] border border-[#2e2e2e] px-4 py-2 rounded-lg shadow-inner">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-mono font-bold tracking-widest">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Guía de Inicio Rápido para Nuevos Usuarios */}
      {!isSetupComplete && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
            <ShieldCheck size={200} className="text-emerald-500" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                <Zap size={12} /> Configuración Pendiente
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                Bienvenido a <span className="text-emerald-500">RutaMax</span>
              </h2>
              <p className="text-zinc-400 text-sm max-w-xl font-medium">
                Para comenzar a gestionar viajes y OTs, primero debemos inicializar tu entorno logístico. Sigue estos pasos para activar tu consola.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {setupSteps.map((step) => (
                <button 
                  key={step.id}
                  onClick={() => navigate(step.path)}
                  className={`
                    flex flex-col items-center justify-center gap-4 p-6 w-40 rounded-3xl border transition-all duration-300
                    ${step.count > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-black border-white/5 text-zinc-600 hover:border-white/20 hover:text-white'}
                  `}
                >
                  <div className={`p-3 rounded-2xl ${step.count > 0 ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    {step.count > 0 ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{step.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Camera Monitoring Modal */}
      {isCameraOpen && selectedTruck && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <header className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                  <Video size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Monitoreo en Vivo: {selectedTruck.plate}</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transmisión encriptada vía 4G/5G</p>
                </div>
              </div>
              <button onClick={() => setIsCameraOpen(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </header>
            
            <div className="flex-1 p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 group">
                {/* Simulated Camera Feed */}
                <img 
                  src={`https://picsum.photos/seed/${selectedTruck.id}/1280/720?blur=1`} 
                  className="w-full h-full object-cover opacity-60" 
                  referrerPolicy="no-referrer"
                  alt="Camera Feed"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto border border-brand-500/30">
                      <Play className="text-brand-500 fill-brand-500" size={32} />
                    </div>
                    <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Conectando con MDVR...</p>
                  </div>
                </div>
                
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">REC</span>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                    CH-01: CABINA
                  </div>
                </div>
                
                <div className="absolute bottom-6 right-6 text-right">
                  <p className="text-[10px] font-mono font-bold text-white/40">{new Date().toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-white/5 p-8 rounded-[2rem] space-y-6">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Control de Audio</h3>
                  <div className="flex items-center gap-6">
                    <button 
                      onMouseDown={() => setIsTransmitting(true)}
                      onMouseUp={() => setIsTransmitting(false)}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isTransmitting ? 'bg-red-500 text-white scale-90 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-brand-500 text-black hover:scale-105'}`}
                    >
                      <Mic size={32} />
                    </button>
                    <div>
                      <p className="text-xs font-black text-white uppercase">{isTransmitting ? 'Transmitiendo...' : 'Presiona para hablar'}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Push-to-Talk habilitado</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 p-8 rounded-[2rem] space-y-6">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Telemetría</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Velocidad</span>
                      <span className="text-sm font-black text-white">{Math.round(selectedTruck.speed)} KM/H</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Latencia</span>
                      <span className="text-sm font-black text-emerald-500">124ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Señal 4G</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? 'bg-brand-500' : 'bg-white/10'}`}></div>)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3">
                  <Volume2 size={16} /> Escuchar Cabina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Transmission Overlay (Mini) */}
      {isTransmitting && !isCameraOpen && selectedTruck && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] bg-red-600 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          <p className="text-xs font-black text-white uppercase tracking-widest">Transmitiendo a {selectedTruck.plate}...</p>
          <button onClick={() => setIsTransmitting(false)} className="p-1 hover:bg-white/10 rounded-lg"><Square size={16} fill="white" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div className="md:col-span-1 space-y-4">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden bg-[#171717] border border-[#2e2e2e] p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group cursor-default"
            >
              <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                <stat.icon size={120} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-white/5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter font-mono">{stat.val}</span>
              </div>
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] relative z-10">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="md:col-span-3 lg:col-span-3 h-[520px] rounded-[2rem] overflow-hidden border border-[#2e2e2e] relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-6 left-6 z-[400] bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Monitoreo Satelital v4.0</span>
          </div>
          
          <MapContainer center={[-33.45, -70.66]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {vehicles.map(v => (
              <Marker key={v.id} position={v.pos} icon={createTruckIcon(v.plate, v.status, v.isSpeeding)}>
                <Popup>
                  <div className="p-4 min-w-[220px] bg-dark-950 text-white rounded-2xl border border-white/5 shadow-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{v.plate}</p>
                        <p className="text-xs font-bold text-white">{v.brand} {v.model}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${v.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {v.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white/5 p-2 rounded-xl text-center">
                        <p className="text-[8px] font-black text-zinc-500 uppercase">Velocidad</p>
                        <p className="text-xs font-bold text-white">{Math.round(v.speed)} km/h</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl text-center">
                        <p className="text-[8px] font-black text-zinc-500 uppercase">Carga</p>
                        <p className="text-xs font-bold text-white uppercase">{v.loadType}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {v.cameraUrl && (
                        <button 
                          onClick={() => { setSelectedTruck(v); setIsCameraOpen(true); }}
                          className="flex-1 bg-brand-500 text-black py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Video size={12} /> Cámara
                        </button>
                      )}
                      {v.hasVoice && (
                        <button 
                          onClick={() => { setSelectedTruck(v); setIsTransmitting(true); }}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Mic size={12} /> Voz
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          {/* Speed Alerts Panel */}
          {alerts.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] overflow-hidden animate-in slide-in-from-right-4">
              <div className="px-8 py-4 border-b border-red-500/20 bg-red-500/10 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <AlertCircle size={14} /> Alertas de Velocidad
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-red-500/10">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase">{alert.plate}</span>
                      <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">{alert.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-red-500">{alert.speed} km/h</div>
                      <div className="text-[8px] text-zinc-500 uppercase font-bold">{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#171717] border border-[#2e2e2e] rounded-[2rem] h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[#2e2e2e] flex justify-between items-center bg-black/20">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Activity size={16} className="text-primary" /> Historial de Tráfico
              </h3>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
               {vehicles.map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/5 group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${v.status === 'on-trip' ? 'bg-primary shadow-[0_0_10px_#10b981]' : 'bg-slate-700'}`}></div>
                      <div>
                        <p className="text-xs font-mono font-black text-white tracking-widest group-hover:text-primary transition-colors uppercase">{v.plate}</p>
                        <p className="text-[9px] font-black text-muted uppercase mt-1 tracking-widest">{v.status === 'on-trip' ? 'En Ruta / Transmisión' : 'Standby / Base'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {v.status === 'on-trip' && (
                         <div className={`text-[10px] font-mono font-bold ${v.isSpeeding ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                           {Math.round(v.speed)}km/h
                         </div>
                       )}
                       <ChevronRight size={16} className="text-[#2e2e2e] group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                 </div>
               ))}
               {vehicles.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
                    <Box size={40} />
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Sin telemetría activa</p>
                 </div>
               )}
            </div>

            <div className="p-8 border-t border-[#2e2e2e] bg-black/10">
              <button 
                onClick={() => navigate('/viajes')}
                className="w-full py-4 bg-primary text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#4ade80] hover:shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-95"
              >
                Panel de Auditoría Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
