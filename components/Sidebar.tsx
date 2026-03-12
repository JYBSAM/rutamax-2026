
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, Users, Truck, Wrench, MapPin, 
  Settings, LogOut, BarChart3, ChevronRight, Zap, X
} from 'lucide-react';
import { useAuth } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Operaciones', icon: TrendingUp, path: '/viajes' },
    { name: 'Analytics', icon: BarChart3, path: '/reportes' },
    { name: 'Tripulación', icon: Users, path: '/conductores' },
    { name: 'Activos', icon: Truck, path: '/flota' },
    { name: 'Taller', icon: Wrench, path: '/mantenimiento' },
    { name: 'Tarifarios', icon: TrendingUp, path: '/tarifarios' },
    { name: 'Nodos', icon: MapPin, path: '/destinos' },
  ];

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <aside className={`
      w-72 bg-[#050505] border-r border-white/5 flex flex-col h-full z-[50] transition-all duration-500
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      fixed lg:relative
    `}>
      <div className="p-8 flex flex-col h-full">
        {/* Logo & Close Button for Mobile */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { onClose(); }}>
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-transform group-hover:rotate-12">
              <Truck size={22} className="text-black" strokeWidth={3} />
            </div>
            <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none">RUTAMAX</h1>
          </div>
          
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-6 px-4">Menu Principal</p>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose} // Auto-close on link click
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-400'} />
                    {item.name}
                  </div>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                  ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="pt-8 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] mb-6">
             <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-emerald-500/10">
                {user?.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{user?.name}</p>
                <p className="text-[9px] text-zinc-600 font-bold truncate uppercase tracking-widest mt-0.5">{user?.role}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <NavLink 
              to="/configuracion" 
              onClick={onClose}
              className="flex items-center justify-center py-4 bg-white/[0.02] rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5 hover:border-emerald-500/30"
            >
              <Settings size={20} />
            </NavLink>
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center py-4 bg-red-500/5 rounded-2xl text-red-500/40 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
