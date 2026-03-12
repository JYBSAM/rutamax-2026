
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Menu, ChevronUp, Bell, X, Zap, Gauge, Radio, Activity } from 'lucide-react';
import { realtimeService } from '../utils/realtimeService';
import { useAuth } from '../App';
import { getDaysRemaining } from '../utils/helpers';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [notification, setNotification] = useState<{title: string, body: string, severity: string} | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);

  const daysLeft = user?.trialStartDate ? getDaysRemaining(user.trialStartDate) : 0;

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((msg) => {
      if (msg.type === 'NOTIFICATION') {
        setNotification(msg.payload);
        setTimeout(() => setNotification(null), 5000);
      } else if (msg.type === 'LOCATION_UPDATE') {
        const speed = msg.payload.speed;
        setCurrentSpeed(speed);
        setIsMoving(speed > 2);
      }
    });
    return unsubscribe;
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowBackToTop(scrollTop > 400);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden font-sans relative">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[45] lg:hidden transition-all duration-300 animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a] z-30 shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5 active:scale-95"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            
            <div className="hidden sm:flex items-center gap-2.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
               <Zap size={14} className="text-emerald-500" />
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em]">Trial: {daysLeft} días</span>
            </div>

            {currentSpeed !== null && (
              <div className={`
                flex items-center gap-3 px-4 py-1.5 rounded-xl border transition-all duration-500 animate-in fade-in zoom-in
                ${isMoving 
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-zinc-900/50 border-white/10 opacity-60'}
              `}>
                <div className="relative">
                  <Gauge size={16} className={isMoving ? 'text-emerald-500' : 'text-zinc-500'} />
                  {isMoving && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isMoving ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
                    <span className={`text-[11px] font-mono font-black tracking-tighter ${isMoving ? 'text-white' : 'text-zinc-500'}`}>
                      {Math.round(currentSpeed)} <span className="text-[8px] opacity-60">KM/H</span>
                    </span>
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none">Telemetría Live</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                <Radio size={14} className="text-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Network: Nominal</span>
             </div>
             <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer group">
                <Bell size={18} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform" />
             </div>
          </div>
        </header>

        {notification && (
          <div className="fixed top-20 right-6 left-6 md:left-auto md:right-8 z-[100] max-w-sm w-auto bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4">
                <div className={`p-2.5 rounded-xl h-fit ${notification.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <Activity size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">{notification.title}</p>
                  <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-relaxed">{notification.body}</p>
                </div>
              </div>
              <button onClick={() => setNotification(null)} className="text-zinc-600 hover:text-white transition-colors"><X size={18} /></button>
            </div>
          </div>
        )}

        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pb-24 relative px-6 md:px-10 scroll-smooth"
        >
          <div className="max-w-[1600px] mx-auto py-8">
            <Outlet />
          </div>
          
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 p-4 bg-[#111] border border-white/10 rounded-full text-zinc-400 hover:text-white hover:border-emerald-500/50 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 group"
            >
              <ChevronUp size={20} className="group-hover:-translate-y-1 transition-transform" />
            </button>
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
