
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, Zap } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { Truck, Trip } from '../types';

const AICopilot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hola. Soy tu asistente de inteligencia logística. ¿En qué puedo optimizar tu flota hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAskAI = async () => {
    if (!input.trim() || !user) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const [trucks, trips] = await Promise.all([
        supabaseService.getItems<any>('trucks', user.companyId),
        supabaseService.getItems<any>('trips', user.companyId)
      ]);

      const context = `
        Eres un analista logístico avanzado de RutaMax TMS.
        Empresa: ${user.companyData?.businessName}
        Datos: Camiones(${trucks.length}), Viajes Activos(${trips.filter((t: any) => t.status !== 'delivered').length}).
        Responde breve, técnico y útil.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction: context },
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || 'Sin respuesta.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Enlace neuronal interrumpido.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-brand-500 text-black rounded-[1.5rem] shadow-[0_0_30px_rgba(62,207,142,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-8 z-[70] w-[380px] h-[550px] glass rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 border-white/10">
           <header className="p-6 bg-brand-500 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                 <Bot size={20} className="text-black" />
                 <h3 className="font-black text-black uppercase text-[10px] tracking-widest">IA Copilot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-black/40 hover:text-black transition-colors"><X size={18} /></button>
           </header>

           <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-dark-950/20">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed ${
                     m.role === 'user' ? 'bg-brand-500 text-black' : 'bg-dark-800 text-white border border-white/5 shadow-xl'
                   }`}>
                      {m.text}
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 p-4 rounded-2xl flex gap-1 border border-white/5">
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
           </div>

           <div className="p-5 bg-black/40 border-t border-white/5">
              <div className="relative">
                 <input 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                   placeholder="Consulta inteligencia de flota..."
                   className="w-full bg-dark-900 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-[10px] font-bold text-white uppercase tracking-wider outline-none focus:border-brand-500/50 transition-all"
                 />
                 <button onClick={handleAskAI} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 hover:text-white transition-colors">
                    <Send size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default AICopilot;
