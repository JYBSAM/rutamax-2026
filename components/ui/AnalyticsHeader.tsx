
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  trend: string;
  isUp: boolean;
  icon: LucideIcon;
  color: string;
}

interface AnalyticsHeaderProps {
  title: string;
  subtitle: string;
  metrics: Metric[];
  chartData: any[];
  dataKeys: { key: string; color: string; name: string }[];
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ title, subtitle, metrics, chartData, dataKeys }) => {
  return (
    <div className="space-y-8 mb-10 animate-in fade-in duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-[#111] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500`}>
              <metric.icon size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/[0.03] ${metric.color} border border-white/5`}>
                <metric.icon size={18} />
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg ${metric.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {metric.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metric.trend}
              </div>
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-white tracking-tighter">{metric.value}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked Area Chart */}
      <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{title}</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{subtitle}</p>
          </div>
          <div className="flex gap-6">
            {dataKeys.map((dk, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dk.color }}></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{dk.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {dataKeys.map((dk, i) => (
                  <linearGradient key={i} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dk.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={dk.color} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#4b5563', fontSize: 10, fontWeight: '700'}} 
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #232323', borderRadius: '12px', padding: '12px'}}
                itemStyle={{fontSize: '10px', fontWeight: '800', textTransform: 'uppercase'}}
                labelStyle={{fontSize: '10px', color: '#6b7280', marginBottom: '4px', fontWeight: '800'}}
              />
              {dataKeys.map((dk, i) => (
                <Area 
                  key={i}
                  type="monotone" 
                  dataKey={dk.key} 
                  stackId="1"
                  stroke={dk.color} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={`url(#gradient-${dk.key})`} 
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
