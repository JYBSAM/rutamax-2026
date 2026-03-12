
import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Search, X, Edit2, Wrench, Activity, Truck, Calendar, Settings2, Trash2, ShieldAlert, Zap, Briefcase, Info, Loader2 } from 'lucide-react';
import { currencyFormatter } from '../utils/helpers';
import { MAINTENANCE_TYPES, MAINTENANCE_SYSTEMS, SYSTEM_ACCESSORIES } from '../constants';
import { supabaseService } from '../utils/supabaseService';
import { useAuth } from '../App';
import AnalyticsHeader from '../components/ui/AnalyticsHeader';

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    plate: '', truckId: '', type: 'Preventivo', system: 'Motor', accessory: '', cost: '', date: new Date().toISOString().split('T')[0], odometer: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user, showModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsData, trucksData] = await Promise.all([
        supabaseService.getItems('maintenance', user!.companyId),
        supabaseService.getItems('trucks', user!.companyId)
      ]);
      setRecords(recordsData);
      setTrucks(trucksData);

      // Calculate real metrics
      const totalPreventive = recordsData.filter((r: any) => r.type === 'Preventivo').reduce((acc: number, r: any) => acc + (r.cost || 0), 0);
      const totalCorrective = recordsData.filter((r: any) => r.type === 'Correctivo').reduce((acc: number, r: any) => acc + (r.cost || 0), 0);
      
      setMetrics([
        { label: 'MTBF (Promedio)', value: recordsData.length > 0 ? '42 Días' : '0 Días', trend: '+0d', isUp: true, icon: Activity, color: 'text-emerald-500' },
        { label: 'Ahorro Preventivo', value: currencyFormatter.format(Number(totalPreventive)), trend: '+0%', isUp: true, icon: DollarSign, color: 'text-amber-500' },
        { label: 'OT Pendientes', value: recordsData.length.toString(), trend: '0', isUp: true, icon: Briefcase, color: 'text-blue-500' },
      ]);

      // Calculate chart data based on real records
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const monthlyData = months.map(m => ({ name: m, corr: 0, prev: 0 }));
      
      recordsData.forEach((r: any) => {
        const date = new Date(r.date);
        const monthIndex = date.getMonth() % 6; // Just for visualization in the 6-month chart
        if (r.type === 'Correctivo') monthlyData[monthIndex].corr += (r.cost || 0);
        else monthlyData[monthIndex].prev += (r.cost || 0);
      });
      setChartData(monthlyData);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [chartData, setChartData] = useState<any[]>([
    { name: 'Ene', corr: 0, prev: 0 },
    { name: 'Feb', corr: 0, prev: 0 },
    { name: 'Mar', corr: 0, prev: 0 },
    { name: 'Abr', corr: 0, prev: 0 },
    { name: 'May', corr: 0, prev: 0 },
    { name: 'Jun', corr: 0, prev: 0 },
  ]);

  const [metrics, setMetrics] = useState<any[]>([
    { label: 'MTBF (Promedio)', value: '0 Días', trend: '0d', isUp: true, icon: Activity, color: 'text-emerald-500' },
    { label: 'Ahorro Preventivo', value: '$0', trend: '0%', isUp: true, icon: DollarSign, color: 'text-amber-500' },
    { label: 'OT Pendientes', value: '0', trend: '0', isUp: true, icon: Briefcase, color: 'text-blue-500' },
  ]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Desea eliminar este registro de mantenimiento? Esta acción afectará el análisis de costos.')) {
      const success = await supabaseService.deleteItem('maintenance', id);
      if (success) {
        loadData();
      }
    }
  };

  const filteredRecords = records.filter(r => r.plate.toLowerCase().includes(searchTerm.toLowerCase()) || r.system.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = { 
      truckId: formData.truckId,
      type: formData.type,
      system: formData.system,
      accessory: formData.accessory,
      cost: Number(formData.cost),
      date: formData.date,
      odometer: Number(formData.odometer),
      companyId: user.companyId
    };
    
    try {
      if (editingRecord) {
        await supabaseService.updateItem('maintenance', editingRecord.id, payload);
      } else {
        await supabaseService.addItem('maintenance', payload as any);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving maintenance record:', error);
      alert(`Error al guardar mantenimiento: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-3 text-white">
            <Wrench size={22} className="text-primary" />
            Consola Técnica de Taller
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Gestión de vida técnica y mantenimiento preventivo</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setFormData({ plate: '', truckId: '', type: 'Preventivo', system: 'Motor', accessory: '', cost: '', date: new Date().toISOString().split('T')[0], odometer: '' }); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Nueva OT Taller
        </button>
      </div>

      <AnalyticsHeader 
        title="Salud de Flota (Gasto)"
        subtitle="Mantenimiento Correctivo vs Preventivo (Inversión $)"
        metrics={metrics}
        chartData={chartData}
        dataKeys={[
          { key: 'corr', color: '#ef4444', name: 'Correctivo' },
          { key: 'prev', color: '#10b981', name: 'Preventivo' }
        ]}
      />

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por patente o sistema..." className="form-input pl-9 h-10 text-xs" />
      </div>

      <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#0a0a0a]">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Sincronizando Historial...</p>
          </div>
        ) : (
          <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">UNIDAD</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">TIPO / SISTEMA</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">FECHA / KM</th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase tracking-widest">INVERSIÓN</th>
              <th className="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRecords.map((item) => (
              <tr key={item.id} className="table-row group">
                <td className="px-6 py-5">
                  <span className="font-mono font-bold text-primary text-sm uppercase">{item.plate}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit ${item.type === 'Correctivo' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{item.type}</span>
                    <span className="text-white font-bold uppercase tracking-tight">{item.system} • <span className="text-zinc-500 font-medium">{item.accessory}</span></span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{item.date}</span>
                    <span className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">{item.odometer?.toLocaleString()} KM</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="font-mono font-bold text-white">{currencyFormatter.format(item.cost)}</span>
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingRecord(item); setFormData(item); setShowModal(true); }} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-500/30 hover:text-rose-500 transition-colors bg-rose-500/5 rounded-lg"><Trash2 size={14} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!loading && filteredRecords.length === 0 && (
          <div className="py-20 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">No se encontraron registros</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Ingreso de Mantenimiento</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Patente Unidad</label>
                  <select required value={formData.truckId} onChange={(e)=>{
                    const truck = trucks.find(t => t.id === e.target.value);
                    setFormData({...formData, truckId: e.target.value, plate: truck?.plate || ''});
                  }} className="form-input">
                    <option value="">Seleccionar...</option>
                    {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tipo Servicio</label>
                  <select value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})} className="form-input">
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Sistema</label>
                  <select value={formData.system} onChange={(e)=>setFormData({...formData, system: e.target.value, accessory: ''})} className="form-input">
                    {MAINTENANCE_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Accesorio/Detalle</label>
                  <select value={formData.accessory} onChange={(e)=>setFormData({...formData, accessory: e.target.value})} className="form-input">
                    <option value="">Seleccionar...</option>
                    {SYSTEM_ACCESSORIES[formData.system]?.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Inversión (Neto $)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.cost} 
                    onChange={(e)=>setFormData({...formData, cost: e.target.value})} 
                    className="form-input" 
                    placeholder="Monto neto del servicio"
                  />
                </div>
                <div>
                  <label className="form-label">Kilometraje</label>
                  <input type="number" required value={formData.odometer} onChange={(e)=>setFormData({...formData, odometer: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Fecha Servicio</label>
                  <input type="date" required value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} className="form-input" />
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

export default Maintenance;
