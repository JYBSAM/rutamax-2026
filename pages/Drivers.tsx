
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, X, Phone, BadgeCheck, Zap, Shield, Calendar, Mail, HeartPulse, Trash2, Loader2 } from 'lucide-react';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { Driver } from '../types';
import { formatRUT, formatPhone } from '../utils/helpers';
import AnalyticsHeader from '../components/ui/AnalyticsHeader';

const Drivers: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '', rut: '', phone: '+569', email: '', licenseType: 'A5', licenseExpiry: '', 
    emergencyContact: '', emergencyPhone: '+569', bloodType: 'O+', status: 'active'
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversData, tripsData] = await Promise.all([
        supabaseService.getItems<Driver>('drivers', user!.companyId),
        supabaseService.getItems<any>('trips', user!.companyId)
      ]);
      
      setDrivers(driversData);

      // Calculate Metrics
      const avgScore = driversData.length > 0 
        ? Math.round(driversData.reduce((acc, d) => acc + (d.performanceRating ?? 100), 0) / driversData.length) 
        : 100;
      
      const availableDrivers = driversData.filter(d => d.status === 'active').length;
      const availability = driversData.length > 0 ? (availableDrivers / driversData.length) * 100 : 0;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringSoon = driversData.filter(d => d.licenseExpiry && new Date(d.licenseExpiry) <= thirtyDaysFromNow).length;

      setMetrics([
        { label: 'Safety Score Global', value: `${avgScore}/100`, trend: '+2pts', isUp: true, icon: Shield, color: 'text-emerald-500' },
        { label: 'Disponibilidad Hoy', value: `${availability.toFixed(1)}%`, trend: '+4%', isUp: true, icon: Zap, color: 'text-amber-500' },
        { label: 'Vencimientos < 30d', value: expiringSoon.toString(), trend: '0', isUp: true, icon: Calendar, color: 'text-rose-500' },
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
          drive: 0,
          rest: 12 // Assume 12h rest by default
        });
      }

      tripsData.forEach(trip => {
        if (!trip.scheduledStart) return;
        const tripDate = new Date(trip.scheduledStart);
        const day = last7Days.find(d => d.date.toDateString() === tripDate.toDateString());
        if (day && trip.status !== 'cancelled') {
          day.drive += 2; // Assume 2h per trip for visualization
          day.rest = Math.max(0, 12 - day.drive);
        }
      });

      setChartData(last7Days.map(({ name, drive, rest }) => ({
        name,
        drive,
        rest
      })));

    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const [metrics, setMetrics] = useState<any[]>([
    { label: 'Safety Score Global', value: '0/100', trend: '0', isUp: true, icon: Shield, color: 'text-emerald-500' },
    { label: 'Disponibilidad Hoy', value: '0%', trend: '0%', isUp: true, icon: Zap, color: 'text-amber-500' },
    { label: 'Vencimientos < 30d', value: '0', trend: '0', isUp: true, icon: Calendar, color: 'text-rose-500' },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Desea eliminar este conductor de la base de datos operativa?')) {
      const success = await supabaseService.deleteItem('drivers', id);
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
      rut: formData.rut,
      phone: formData.phone,
      email: formData.email,
      licenseType: formData.licenseType,
      licenseExpiry: formData.licenseExpiry,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      bloodType: formData.bloodType,
      status: formData.status,
      companyId: user.companyId
    };
    
    try {
      if (editingDriver) {
        await supabaseService.updateItem('drivers', editingDriver.id, payload);
      } else {
        await supabaseService.addItem('drivers', payload);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving driver:', error);
      alert(`Error al guardar conductor: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredDrivers = drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.rut.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
            <BadgeCheck size={22} className="text-primary" />
            Control de Tripulación
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Monitoreo de capital humano y seguridad vial</p>
        </div>
        <button onClick={() => { setEditingDriver(null); setFormData({ name: '', rut: '', phone: '+569', email: '', licenseType: 'A5', licenseExpiry: '', emergencyContact: '', emergencyPhone: '+569', bloodType: 'O+', status: 'active' }); setShowModal(true); }} className="btn-primary">
          <UserPlus size={16} /> Enrolar Conductor
        </button>
      </div>

      <AnalyticsHeader 
        title="Fatiga vs Conducción"
        subtitle="Monitoreo de horas activas de la tripulación (Promedio)"
        metrics={metrics}
        chartData={chartData}
        dataKeys={[
          { key: 'drive', color: '#10b981', name: 'Horas Conducción' },
          { key: 'rest', color: '#f59e0b', name: 'Horas Descanso' }
        ]}
      />

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o RUT..." className="form-input pl-9 text-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Cargando Tripulación...</p>
          </div>
        ) : filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-[#111] border border-white/5 rounded-[2rem] p-8 transition-all hover:border-emerald-500/20 group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-black text-sm">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{driver.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{driver.rut}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ (driver.performanceRating ?? 100) > 80 ? 'bg-emerald-500/10 text-emerald-500' : (driver.performanceRating ?? 100) > 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500' }`}>
                          {driver.performanceRating ?? 100}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setEditingDriver(driver); setFormData(driver); setShowModal(true); }} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                     <button onClick={() => handleDelete(driver.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors bg-rose-500/5 rounded-lg"><Trash2 size={14} /></button>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-black/40 p-3 rounded-xl border border-white/5">
                     <span className="text-zinc-500">Licencia {driver.licenseType}</span>
                     <span className={new Date(driver.licenseExpiry) < new Date() ? 'text-rose-500' : 'text-emerald-500'}>{driver.licenseExpiry}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                        <Phone size={14} /> {driver.phone}
                     </div>
                     <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${driver.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                        {driver.status === 'active' ? 'Activo' : 'Inactivo'}
                     </div>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron conductores</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Enrolamiento de Conductor</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="form-label">Nombre Completo</label>
                  <input required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value.toUpperCase()})} className="form-input" placeholder="Ej: JUAN PÉREZ GONZÁLEZ" />
                </div>
                <div>
                  <label className="form-label">RUT</label>
                  <input 
                    required 
                    value={formData.rut} 
                    onChange={(e)=>setFormData({...formData, rut: formatRUT(e.target.value)})} 
                    className="form-input" 
                    placeholder="Ej: 18433555K" 
                    maxLength={9} 
                  />
                </div>
                <div>
                  <label className="form-label">Tipo Licencia</label>
                  <select value={formData.licenseType} onChange={(e)=>setFormData({...formData, licenseType: e.target.value})} className="form-input">
                    <option value="A2">A2</option>
                    <option value="A4">A4</option>
                    <option value="A5">A5 (Pesados)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Vencimiento Licencia</label>
                  <input type="date" required value={formData.licenseExpiry} onChange={(e)=>setFormData({...formData, licenseExpiry: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Teléfono Móvil</label>
                  <input 
                    required 
                    value={formData.phone} 
                    onChange={(e)=>setFormData({...formData, phone: formatPhone(e.target.value)})} 
                    className="form-input" 
                    placeholder="+569 8877 6655" 
                  />
                </div>
                <div>
                  <label className="form-label">Contacto Emergencia</label>
                  <input value={formData.emergencyContact} onChange={(e)=>setFormData({...formData, emergencyContact: e.target.value})} className="form-input" placeholder="Ej: María (Esposa)" />
                </div>
                <div>
                  <label className="form-label">Fono Emergencia</label>
                  <input 
                    value={formData.emergencyPhone} 
                    onChange={(e)=>setFormData({...formData, emergencyPhone: formatPhone(e.target.value)})} 
                    className="form-input" 
                    placeholder="+569" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
