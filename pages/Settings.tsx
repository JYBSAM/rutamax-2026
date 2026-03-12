
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Shield, CreditCard, Edit2, MapPin, Mail, Camera, ShieldCheck, Zap, Info, History } from 'lucide-react';
import { useAuth } from '../App';
import { currencyFormatter } from '../utils/helpers';
import { auditService, AuditEntry } from '../utils/auditService';

const Settings: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'auditoria') {
      setAuditLogs(auditService.getLogs());
    }
  }, [activeTab]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateUserProfile({ avatarUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil' },
    { id: 'empresa', label: 'Datos Empresa' },
    { id: 'suscripcion', label: 'Suscripción' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'auditoria', label: 'Auditoría' },
  ];

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-10 animate-in">
        
        <header className="space-y-1">
          <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">Configuración</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Gestión de Identidad y Empresa</p>
        </header>

        <div className="flex border-b border-white/5 bg-black/50 sticky top-0 z-30 pt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-8 py-4 text-[9px] uppercase tracking-[0.2em] font-black transition-all relative
                ${activeTab === tab.id ? 'text-[#3ecf8e]' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3ecf8e]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'perfil' && (
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[2rem] space-y-12">
               <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                     <div className="w-32 h-32 bg-[#111] border border-[#3ecf8e]/20 rounded-3xl overflow-hidden flex items-center justify-center transition-all group-hover:border-[#3ecf8e] group-hover:shadow-[0_0_40px_#3ecf8e22]">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={48} className="text-slate-800" />
                        )}
                     </div>
                     <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#3ecf8e] text-black rounded-xl flex items-center justify-center shadow-2xl border-4 border-black group-hover:scale-110 transition-transform">
                        <Camera size={18} />
                     </div>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                  <div className="text-center md:text-left space-y-1">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">{user?.name}</h3>
                     <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
                        <Mail size={14} />
                        <span className="text-xs font-bold">{user?.email || `ID: ${user?.id}`}</span>
                     </div>
                     <div className="pt-3">
                        <span className="bg-[#3ecf8e]/10 text-[#3ecf8e] px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#3ecf8e]/20">
                           Tenant: {user?.companyId}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'empresa' && (
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[2.5rem] space-y-10 animate-in slide-in-from-right">
                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                   <ShieldCheck className="text-[#3ecf8e]" size={24} />
                   <h3 className="text-lg font-black text-white uppercase">Información Corporativa</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Razón Social</label>
                      <input readOnly value={user?.companyData?.businessName || 'Empresa No Configurada'} className="w-full bg-black border border-white/10 rounded-xl py-5 px-6 text-sm font-black text-white outline-none" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">RUT Fiscal</label>
                      <input readOnly value={user?.companyData?.businessRut || 'N/A'} className="w-full bg-black border border-white/10 rounded-xl py-5 px-6 text-sm font-black text-slate-400 outline-none" />
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'suscripcion' && (
            <div className="space-y-8 animate-in zoom-in-95">
               <div className="bg-gradient-to-br from-[#0d0d0d] to-black border border-white/5 p-12 rounded-[2.5rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#3ecf8e]/5 blur-[100px] rounded-full"></div>
                  <Shield size={40} className="text-[#3ecf8e] mx-auto" />
                  <div className="space-y-3">
                     <h3 className="text-2xl font-black text-white uppercase">
                       Estado: {user?.subscriptionStatus === 'trial' ? 'Prueba Gratuita' : 
                               user?.subscriptionStatus === 'active' ? 'Plan Activo' : 'Suscripción Expirada'}
                     </h3>
                     {user?.subscriptionStatus === 'trial' && (
                       <p className="text-[10px] text-[#3ecf8e] font-black uppercase tracking-widest">
                         {(() => {
                           const start = new Date(user.trialStartDate || new Date());
                           const now = new Date();
                           const diff = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                           const remaining = Math.max(0, 14 - diff);
                           return `${remaining} Días Disponibles`;
                         })()}
                       </p>
                     )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[2.5rem] space-y-10 animate-in slide-in-from-right">
                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                   <Camera className="text-[#3ecf8e]" size={24} />
                   <h3 className="text-lg font-black text-white uppercase">Hardware de Monitoreo Recomendado</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                      <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                        <Zap size={24} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">MDVR 4G/GPS Profesional</h4>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Grabador de video digital móvil con conectividad 4G y seguimiento GPS en tiempo real. Soporta hasta 4 cámaras AHD 1080P.
                      </p>
                      <div className="pt-4 flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-zinc-600">Costo Estimado</span>
                          <span className="text-brand-500">$120 - $180 USD</span>
                        </div>
                        <a 
                          href="https://www.aliexpress.com/w/wholesale-4CH-4G-GPS-MDVR.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl text-center transition-all"
                        >
                          Ver en AliExpress
                        </a>
                      </div>
                    </div>

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <ShieldCheck size={24} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Kit de Cámaras AHD</h4>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Cámaras con visión nocturna (IR) y micrófono integrado para cabina. Resistentes a vibraciones y climas extremos.
                      </p>
                      <div className="pt-4 flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-zinc-600">Costo Instalación</span>
                          <span className="text-blue-500">$100 - $200 USD</span>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase text-center">Incluye cableado y configuración</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-brand-500/5 border border-brand-500/20 rounded-3xl">
                    <div className="flex items-start gap-4">
                      <Info className="text-brand-500 shrink-0" size={20} />
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Nota de Implementación</h5>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                          Para habilitar el monitoreo en vivo en RutaMax, cada unidad debe contar con un plan de datos M2M (aprox. 5GB/mes). Una vez instalado el hardware, simplemente ingresa la URL del stream en la configuración del camión.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'auditoria' && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
               <div className="divide-y divide-white/5">
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                       <div className={`mt-1 w-2 h-2 rounded-full ${log.severity === 'danger' ? 'bg-red-500' : 'bg-[#3ecf8e]'}`}></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{log.action}</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">{log.details}</p>
                       </div>
                    </div>
                  )) : (
                    <div className="p-20 text-center text-slate-600 uppercase font-black text-[10px]">Sin registros de actividad</div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
