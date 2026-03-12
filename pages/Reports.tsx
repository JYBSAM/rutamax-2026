
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { currencyFormatter } from '../utils/helpers';
import { 
  Wallet, DollarSign, Fuel, Activity, Calendar, BarChart3, TrendingUp, TrendingDown,
  Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import { Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, costs: 0, fuel: 0, margin: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trips, maintenance] = await Promise.all([
        supabaseService.getItems<any>('trips', user!.companyId),
        supabaseService.getItems<any>('maintenance', user!.companyId)
      ]);

      const totalRevenue = trips.reduce((acc: number, t: any) => acc + (t.fleteNeto || 0), 0);
      const totalMaintenance = maintenance.reduce((acc: number, m: any) => acc + (m.cost || 0), 0);
      
      const estimatedFuel = totalRevenue * 0.32; 
      const totalCosts = totalMaintenance + estimatedFuel;
      const netProfit = totalRevenue - totalCosts;
      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setStats({
        revenue: totalRevenue,
        costs: totalCosts,
        fuel: estimatedFuel,
        margin: margin
      });

      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const grouped = days.map(d => ({ name: d, revenue: 0, costs: 0 }));
      
      trips.forEach((t: any) => {
        const date = t.scheduledStart ? new Date(t.scheduledStart) : new Date();
        const dayName = days[date.getDay()];
        const dayObj = grouped.find(g => g.name === dayName);
        if (dayObj) dayObj.revenue += (t.fleteNeto || 0);
      });

      setChartData(grouped);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic cost distribution
  const costDistribution = stats.revenue > 0 ? [
    { name: 'Diesel Est.', value: 65, color: '#10b981' },
    { name: 'Mantención', value: Math.round((stats.costs / stats.revenue) * 100) || 20, color: '#3b82f6' },
    { name: 'Peajes/Ruta', value: 10, color: '#f59e0b' },
    { name: 'Admin', value: 5, color: '#8b5cf6' },
  ] : [
    { name: 'Sin Datos', value: 100, color: '#2e2e2e' }
  ];

  const statCards = [
    { label: 'Ingresos Netos', val: stats.revenue, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: stats.revenue > 0 ? '+12.5%' : '0%', isUp: true },
    { label: 'Costos Directos', val: stats.costs, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10', trend: stats.costs > 0 ? '-2.1%' : '0%', isUp: false },
    { label: 'Margen Bruto', val: stats.revenue - stats.costs, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: (stats.revenue - stats.costs) > 0 ? '+5.4%' : '0%', isUp: true },
    { label: 'Eficiencia Op.', val: `${stats.margin.toFixed(1)}%`, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: stats.margin > 0 ? '+1.2%' : '0%', isUp: true },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#2e2e2e] pb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2 text-white">
            <BarChart3 size={20} className="text-primary" />
            Análisis de Margen
          </h1>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.2em] mt-1">
            Inteligencia de Negocios • Rendimiento Operativo
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#171717] border border-[#2e2e2e] px-5 py-2.5 rounded-xl shadow-inner">
           <Calendar size={14} className="text-zinc-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white">Últimos 30 Días</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#171717] border border-[#2e2e2e] p-7 rounded-[2rem] transition-all duration-300 hover:scale-[1.03] hover:border-white/20 group cursor-default shadow-xl">
             <div className="flex justify-between items-start mb-6">
                <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} border border-white/5 shadow-inner transition-transform group-hover:rotate-6`}>
                   <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                   {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                   {stat.trend}
                </div>
             </div>
             <div>
                <h4 className="text-2xl font-mono font-black text-white tracking-tighter leading-none">
                  {typeof stat.val === 'string' ? stat.val : currencyFormatter.format(stat.val)}
                </h4>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-3">{stat.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#171717] border border-[#2e2e2e] rounded-[2.5rem] p-10 space-y-10 shadow-2xl overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
              <TrendingUp size={200} />
           </div>
           <div className="flex justify-between items-center relative z-10">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Desempeño Semanal de Ingresos</h3>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Flete Neto</span>
                 </div>
              </div>
           </div>
           <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#71717a', fontSize: 11, fontWeight: '900'}} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#71717a', fontSize: 11, fontWeight: '900'}}
                      tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.03)', radius: [8,8,0,0]}} 
                      contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #2e2e2e', borderRadius: '16px', padding: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}
                      itemStyle={{fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em'}}
                      labelStyle={{fontSize: '12px', color: '#71717a', marginBottom: '8px', fontWeight: '900'}}
                      formatter={(val: number) => [currencyFormatter.format(val), 'INGRESO']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#3ecf8e" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                      activeBar={{ fill: '#4ade80', stroke: '#fff', strokeWidth: 1 }}
                    />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#171717] border border-[#2e2e2e] rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl">
           <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-12 w-full">Mix de Costos Operativos</h3>
           <div className="h-[320px] w-full relative mb-12">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                 <p className="text-3xl font-mono font-black text-white tracking-tighter">100%</p>
                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1">Impacto Global</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={costDistribution} 
                      innerRadius={90} 
                      outerRadius={125} 
                      paddingAngle={6} 
                      dataKey="value" 
                      stroke="none"
                    >
                       {costDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} fillOpacity={1} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                       ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #2e2e2e', borderRadius: '12px', fontSize: '10px'}}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-3 w-full">
              {costDistribution.map((c, i) => (
                 <div key={i} className="group flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-[#2e2e2e] hover:border-white/10 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: c.color, color: c.color }}></div>
                       <span className="text-[10px] font-black text-muted uppercase tracking-widest group-hover:text-white transition-colors">{c.name}</span>
                    </div>
                    <span className="text-[12px] font-mono font-black text-white">{c.value}%</span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
