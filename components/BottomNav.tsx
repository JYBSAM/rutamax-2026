
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, Truck, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navItems = [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Viajes', icon: TrendingUp, path: '/viajes' },
    { name: 'Equipo', icon: Users, path: '/conductores' },
    { name: 'Flota', icon: Truck, path: '/flota' },
    { name: 'Ajustes', icon: Settings, path: '/configuracion' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-3xl border-t border-white/5 px-6 py-3 flex justify-between items-center shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all duration-300
            ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}
          `}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
