
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Building2, MapPin, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { formatRUT, formatPhone } from '../utils/helpers';
import { CHILE_REGIONS } from '../constants';

const GIROS = [
  "Transporte de Carga por Carretera",
  "Servicios de Almacenamiento y Depósito",
  "Actividades de Mensajería y Courier",
  "Alquiler de Camiones y Maquinaria Pesada",
  "Servicios de Mudanza",
  "Distribución Logística",
  "Servicios Portuarios y Aduaneros"
];

const Onboarding: React.FC = () => {
  const { completeOnboarding, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessRut: '',
    businessPhone: '+569',
    address: '',
    region: 'Metropolitana',
    commune: '',
    giro: GIROS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await completeOnboarding(formData);
    } finally {
      setLoading(false);
    }
  };

  const currentRegion = CHILE_REGIONS.find(r => r.name === formData.region);
  const communes = currentRegion ? currentRegion.communes : [];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl mb-6 flex justify-end">
        <button 
          onClick={logout}
          className="text-[10px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          Cerrar Sesión / Volver a la Landing
        </button>
      </div>
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 space-y-10 shadow-2xl animate-in zoom-in-95">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
             <ShieldCheck size={14} strokeWidth={2.5} />
             CONFIGURACIÓN DE CUENTA EMPRESARIAL
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">RutaMax <span className="text-primary">Master</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Inicializa tu entorno logístico • 14 Días de Prueba</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="form-label">Razón Social</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required 
                  value={formData.businessName} 
                  onChange={(e) => setFormData({...formData, businessName: e.target.value.toUpperCase()})} 
                  className="form-input w-full h-14 pl-12 font-black text-sm uppercase" 
                  placeholder="EJ: TRANSPORTES INTERNACIONALES LIMITADA" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="form-label">RUT Empresa</label>
                <input 
                  required 
                  value={formData.businessRut} 
                  onChange={(e) => setFormData({...formData, businessRut: formatRUT(e.target.value)})} 
                  className="form-input w-full h-14 font-mono font-black text-sm" 
                  placeholder="76.555.444-K" 
                  maxLength={9} 
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Actividad / Giro</label>
                <select 
                  value={formData.giro} 
                  onChange={(e) => setFormData({...formData, giro: e.target.value})} 
                  className="form-input w-full h-14 text-sm font-black"
                >
                  {GIROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="form-label">Región Matriz</label>
                  <select 
                    value={formData.region} 
                    onChange={(e) => setFormData({...formData, region: e.target.value, commune: ''})} 
                    className="form-input w-full h-14 font-black text-sm"
                  >
                    {CHILE_REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="form-label">Comuna</label>
                  <select 
                    required 
                    value={formData.commune} 
                    onChange={(e) => setFormData({...formData, commune: e.target.value})} 
                    className="form-input w-full h-14 font-black text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {communes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">Dirección Matriz</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})} 
                  className="form-input w-full h-14 pl-12 font-black text-sm uppercase" 
                  placeholder="EJ: AV. AMÉRICO VESPUCIO 1500" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">Teléfono Corporativo</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required 
                  value={formData.businessPhone} 
                  onChange={(e) => setFormData({...formData, businessPhone: formatPhone(e.target.value)})} 
                  className="form-input w-full h-14 pl-12 font-black text-sm" 
                  placeholder="+569" 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Activar Plataforma Logística <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <footer className="text-center pt-4 space-y-4">
           <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">Cifrado de datos AES-256 Industrial</p>
           <button 
             onClick={logout}
             className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
           >
             Cerrar Sesión y volver a la Landing
           </button>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;
