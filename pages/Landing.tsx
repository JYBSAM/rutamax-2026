
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Shield, Zap, BarChart3, Truck, ArrowRight,
  CheckCircle2, Star, Play, Layers, ShieldCheck, 
  Globe, Activity, Target, Wallet, Smartphone,
  Calendar, MapPin, ClipboardCheck, Fuel, AlertCircle, FileText,
  X, Briefcase, Terminal, Cpu, Box, LayoutGrid, Timer, Navigation,
  ChevronRight, BarChart, ChevronDown, Quote, Download, MousePointer2,
  Wrench, FileCheck, MonitorDot
} from 'lucide-react';
import { currencyFormatter } from '../utils/helpers';
import { PLANS } from '../constants';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [truckCount, setTruckCount] = useState(12);
  const [efficiency, setEfficiency] = useState(15);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const savingsBreakdown = useMemo(() => {
    const total = truckCount * 95000 * (1 + (efficiency / 100)) * 12;
    return {
      total,
      fuel: total * 0.45,
      admin: total * 0.30,
      maintenance: total * 0.25
    };
  }, [truckCount, efficiency]);

  const featuredCompanies = [
    { name: "Andes Logística", icon: "🏔️" },
    { name: "Ruta Austral Trans", icon: "🚛" },
    { name: "Pacific Cargo Chile", icon: "🌊" },
    { name: "EcoCargo Express", icon: "🍃" },
    { name: "SiderTrans Pudahuel", icon: "🏗️" },
    { name: "Conexión Minera", icon: "⛏️" },
    { name: "Logística del Maipo", icon: "🍇" },
    { name: "Transportes Valpo", icon: "⚓" }
  ];

  const modules = [
    { 
      title: "Torre de Control", 
      desc: "Visibilidad total de la flota en tiempo real con telemetría predictiva.", 
      icon: <MonitorDot size={32} />,
      color: "from-emerald-500/20 to-transparent"
    },
    { 
      title: "App del Conductor", 
      desc: "Bitácoras, checklists de seguridad y firma digital sin papeles.", 
      icon: <Smartphone size={32} />,
      color: "from-blue-500/20 to-transparent"
    },
    { 
      title: "Gestión de Taller", 
      desc: "Alertas preventivas y control de costos de mantenimiento por unidad.", 
      icon: <Wrench size={32} />,
      color: "from-amber-500/20 to-transparent"
    },
    { 
      title: "Seguridad Crítica", 
      desc: "Protocolos automáticos para Carga Peligrosa (IMO) y bloqueo de conductores por bajo score.", 
      icon: <ShieldCheck size={32} />,
      color: "from-red-500/20 to-transparent"
    },
    { 
      title: "Liquidaciones", 
      desc: "Facturación y pago a choferes automatizado basado en OT entregada.", 
      icon: <FileCheck size={32} />,
      color: "from-purple-500/20 to-transparent"
    }
  ];

  const faqs = [
    { q: "¿Requiere instalación de GPS físico?", a: "No. RutaMax utiliza la telemetría del smartphone del conductor mediante nuestra App nativa, eliminando costos de hardware y contratos de 24 meses." },
    { q: "¿Cómo funciona la prueba gratuita?", a: "Ofrecemos 14 días de acceso total a todas las funciones (Torre de Control, App Chofer, Tarifarios) para que puedas validar el ahorro real en tu operación antes de pagar." },
    { q: "¿Funciona en zonas sin señal de internet?", a: "Sí. El sistema cuenta con modo offline que sincroniza automáticamente todas las bitácoras y checklists una vez recuperada la conexión." },
    { q: "¿Cómo se gestionan las guías y documentos?", a: "Incluimos OCR (reconocimiento óptico) para que el chofer tome una foto a la guía y el sistema extraiga los datos automáticamente para la liquidación." }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-[#ededed] selection:bg-emerald-500 selection:text-black font-sans overflow-x-hidden relative bg-[#050505]">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-emerald-500/10 blur-[200px] rounded-full"></div>
      </div>

      {/* Dynamic Glass Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-6 sm:px-16 py-5 flex justify-between items-center transition-all duration-500 border-b ${
        scrollY > 50 
          ? 'bg-black/60 backdrop-blur-xl border-white/10 py-4' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:rotate-6 transition-all">
            <Truck size={22} className="text-black" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
            RUTAMAX <span className="text-emerald-500">TMS</span>
          </h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          {['Operación', 'Módulos', 'Ahorro', 'FAQ'].map((item) => (
            <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-emerald-400 transition-all">{item}</button>
          ))}
        </div>

        <button onClick={() => navigate('/login')} className="bg-emerald-500 text-black px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl active:scale-95 border border-white/10">
          Acceso Clientes
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-64 pb-32 px-6 flex flex-col items-center text-center max-w-7xl mx-auto">
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.4em] mb-4 shadow-inner">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
             Intelligence Logistics • v3.8 Core
          </div>

          <h1 className="text-5xl md:text-[7rem] font-black leading-[0.9] tracking-tighter text-white">
            LOGÍSTICA <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 bg-clip-text text-transparent italic">MÁS INTELIGENTE</span>
          </h1>

          <p className="max-w-3xl mx-auto text-zinc-400 text-lg md:text-2xl font-medium leading-relaxed">
            Elimina la fricción operativa. Una plataforma unificada para gestionar <span className="text-white border-b-2 border-emerald-500/50">flota, activos y tripulación</span> con telemetría predictiva.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button 
              onClick={() => navigate('/login')} 
              className="px-12 py-5 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center gap-3 hover:bg-emerald-400 transition-all shadow-[0_20px_60px_rgba(16,185,129,0.3)] group"
            >
              Iniciar Prueba Gratuita <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('ahorro')}
              className="px-12 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-white font-black uppercase text-[12px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
            >
               <BarChart size={16} className="text-emerald-400" /> Ver Potencial de Ahorro
            </button>
          </div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-4">Sin tarjetas de crédito • 14 días de acceso total</p>
        </div>
      </section>

      {/* Featured Companies - Infinite Marquee */}
      <section className="relative z-10 py-16 border-y border-white/5 bg-black/40 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee group">
          {[...featuredCompanies, ...featuredCompanies].map((co, i) => (
            <div key={i} className="inline-flex items-center gap-4 mx-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-3xl">{co.icon}</span>
              <span className="text-xl font-black text-zinc-300 tracking-tighter uppercase">{co.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Critical Security Advisory Section */}
      <section className="relative z-10 py-24 px-6 bg-red-500/5 border-y border-red-500/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
              <AlertCircle size={14} strokeWidth={2.5} />
              AVISO DE SEGURIDAD CRÍTICA
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              EL COSTO DE LA <br /><span className="text-red-500 italic">VELOCIDAD EXCESIVA</span>
            </h2>
            <p className="text-zinc-400 text-lg font-medium leading-relaxed">
              Los recientes eventos fatales en la Región Metropolitana han demostrado que el control manual no es suficiente. En el transporte de <span className="text-white font-bold">Cargas Peligrosas (IMO)</span> y <span className="text-white font-bold">Combustibles</span>, un error de 5 km/h puede ser la diferencia entre una operación exitosa y una tragedia nacional.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <Shield size={20} className="text-red-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Control IMO Estricto</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">Bloqueo automático de viaje al exceder los 80 km/h en cargas críticas.</p>
              </div>
              <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <Activity size={20} className="text-red-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Score de Riesgo</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">Suspensión inmediata de conductores con comportamiento errático detectado por IA.</p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full"></div>
             <div className="relative bg-zinc-900/80 border border-red-500/30 p-10 rounded-[3rem] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Protocolo de Emergencia Activo</span>
                   </div>
                   <span className="text-[10px] font-mono text-red-500 font-bold">ALERTA NIVEL 5</span>
                </div>
                <div className="space-y-6">
                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[11px] font-black text-white uppercase mb-2">Empresas Objetivo:</p>
                      <div className="flex flex-wrap gap-2">
                         {['Transporte de Gas', 'Combustibles', 'Químicos', 'Minería Pesada', 'Carga IMO'].map(t => (
                            <span key={t} className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-bold text-red-400 border border-red-500/10">{t}</span>
                         ))}
                      </div>
                   </div>
                   <p className="text-xs text-zinc-500 font-medium italic">"RutaMax no es solo un software de gestión, es un sistema de prevención de fatalidades diseñado para las rutas más exigentes de Chile."</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Interactive Modules Showcase */}
      <section id="módulos" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">SISTEMA MODULAR</h2>
          <p className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.5em]">El cerebro de tu operación logística</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-4">
            {modules.map((m, i) => (
              <div 
                key={i}
                onMouseEnter={() => setActiveModule(i)}
                className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group relative overflow-hidden ${
                  activeModule === i 
                    ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_20px_40px_rgba(16,185,129,0.1)]' 
                    : 'bg-black border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className={`mb-6 transition-transform duration-500 ${activeModule === i ? 'text-emerald-500 scale-110' : 'text-zinc-600'}`}>
                  {m.icon}
                </div>
                <h4 className={`text-sm font-black uppercase tracking-widest ${activeModule === i ? 'text-white' : 'text-zinc-500'}`}>
                  {m.title}
                </h4>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[4rem] p-12 md:p-20 relative overflow-hidden min-h-[400px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
              {modules[activeModule].icon}
            </div>
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
               <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                 {modules[activeModule].title}
               </h3>
               <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed max-w-md">
                 {modules[activeModule].desc}
               </p>
               <div className="pt-6">
                 <button onClick={() => navigate('/login')} className="flex items-center gap-3 text-emerald-500 font-black uppercase text-xs tracking-widest group">
                   Explorar Funciones <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Efficiency Section */}
      <section id="ahorro" className="relative z-10 py-48 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                SIMULA TU <br /><span className="text-emerald-500 italic">ROI REAL</span>
              </h2>
              <p className="text-zinc-500 text-lg">Ajusta los parámetros para ver cómo la optimización de rutas y la digitalización de documentos impactan en tu bolsillo mensualmente.</p>
            </div>

            <div className="space-y-12 bg-zinc-900/40 p-10 rounded-[2.5rem] border border-white/5">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Unidades de Flota</label>
                  <span className="text-3xl font-black text-white">{truckCount} Camiones</span>
                </div>
                <input 
                  type="range" min="1" max="100" step="1" 
                  value={truckCount} onChange={(e) => setTruckCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Nivel de Eficiencia</label>
                  <span className="text-3xl font-black text-emerald-500">+{efficiency}%</span>
                </div>
                <input 
                  type="range" min="5" max="40" step="5" 
                  value={efficiency} onChange={(e) => setEfficiency(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full"></div>
            <div className="relative bg-emerald-500 p-12 md:p-16 rounded-[4rem] text-black shadow-[0_40px_100px_rgba(16,185,129,0.25)] flex flex-col justify-between h-full min-h-[550px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">Impacto Económico Anual</p>
                <h4 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-12">
                  {currencyFormatter.format(savingsBreakdown.total)}
                </h4>
                
                <div className="space-y-6 pt-10 border-t border-black/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Fuel size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Ahorro Combustible</span>
                    </div>
                    <span className="font-mono font-bold">{currencyFormatter.format(savingsBreakdown.fuel)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Timer size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Eficiencia Admin</span>
                    </div>
                    <span className="font-mono font-bold">{currencyFormatter.format(savingsBreakdown.admin)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex items-center justify-between gap-6 p-6 bg-black/5 rounded-3xl border border-black/5">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={16} /> Auditoría Real
                 </div>
                 <button onClick={() => navigate('/login')} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-xl">
                    Solicitar Demo
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase (Screenshots) */}
      <section id="operación" className="relative z-10 py-32 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6">
               <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">INTERFAZ DE GRADO INDUSTRIAL</h2>
               <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.5em]">Velocidad y respuesta en cada pixel</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="h-8 bg-zinc-900 flex items-center gap-2 px-4">
                     <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                     <div className="w-2 h-2 rounded-full bg-amber-500/40"></div>
                     <div className="w-2 h-2 rounded-full bg-emerald-500/40"></div>
                  </div>
                  <div className="p-8 h-[400px] flex items-center justify-center">
                     <Navigation className="text-emerald-500 animate-pulse" size={64} />
                  </div>
               </div>
               <div className="space-y-8">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Monitoreo Satelital</h3>
                  <p className="text-zinc-400 text-lg">Visualiza tu flota con precisión de metros. Nuestra capa de mapas está optimizada para cargar miles de unidades sin lag.</p>
                  <ul className="space-y-4">
                    {['Telemetría GPS en vivo', 'Control estricto IMO (80 km/h max)', 'Suspensión automática de viajes', 'Historial de rutas 90 días'].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-emerald-400">
                        <CheckCircle2 size={16} /> {f}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-32 px-6 max-w-4xl mx-auto">
         <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">FAQ</h2>
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.5em]">Preguntas frecuentes</p>
         </div>
         <div className="space-y-4">
            {faqs.map((faq, i) => (
               <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                  >
                     <span className="text-sm font-black text-white uppercase tracking-tight">{faq.q}</span>
                     <ChevronDown className={`text-emerald-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} size={20} />
                  </button>
                  {openFaq === i && (
                     <div className="p-6 pt-0 text-zinc-400 text-sm font-medium border-t border-white/5 animate-in slide-in-from-top-2">
                        {faq.a}
                     </div>
                  )}
               </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-32 border-t border-white/5 bg-black px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-24">
          <div className="space-y-8 md:col-span-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                 <Truck size={22} className="text-black" />
               </div>
               <h4 className="text-2xl font-black text-white tracking-tighter uppercase">RUTAMAX</h4>
             </div>
             <p className="text-zinc-500 text-sm max-w-sm leading-relaxed font-medium">
               Optimizando el transporte de carga pesado en Chile mediante ingeniería de datos y digitalización de activos móviles.
             </p>
          </div>
          <div className="space-y-6">
             <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Contacto</h5>
               <p className="text-zinc-600 text-[11px] font-black uppercase tracking-widest leading-loose">
                 Soporte: hola@rutamax.cl<br />
                 Ventas: (+56) 9 8877 6655
               </p>
          </div>
          <div className="space-y-6">
             <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Badges</h5>
             <div className="flex gap-4 opacity-20">
                <ShieldCheck size={24} />
                <Zap size={24} />
                <Star size={24} />
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-32 border-t border-white/5 mt-20 opacity-30">
           <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em]">© 2024 RUTAMAX LOGISTICS SYSTEMS • MADE IN CHILE</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
