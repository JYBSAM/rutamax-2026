
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role } from '../types';
import { supabase } from '../utils/supabaseClient';
import { Truck, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatRUT } from '../utils/helpers';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginType, setLoginType] = useState<'admin' | 'driver'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // 1. Sign up in Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: identifier,
          password: password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          try {
            // 2. Create a company first
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .insert([{ 
                business_name: `Empresa de ${fullName}`, 
                business_rut: `TEMP-${Date.now()}`,
                giro: 'Transporte de Carga por Carretera',
                created_by: authData.user.id
              }])
              .select()
              .single();
            
            if (companyError) {
              console.error('Error creating company:', companyError);
              throw new Error(`Error al crear la empresa: ${companyError.message}`);
            }

            if (!company) {
              throw new Error('No se pudo obtener la información de la empresa creada.');
            }

            // 3. Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                id: authData.user.id,
                full_name: fullName,
                email: identifier,
                role: 'admin',
                company_id: company.id,
                onboarding_complete: false
              }]);
            
            if (profileError) {
              console.error('Error creating profile:', profileError);
              throw new Error(`Error al crear el perfil: ${profileError.message}`);
            }
            
            alert('Cuenta creada con éxito. Ya puedes iniciar sesión.');
            setMode('login');
          } catch (innerErr: any) {
            console.error('Signup cleanup error:', innerErr);
            setError(innerErr.message || 'Error durante la configuración inicial de la cuenta.');
          }
        }
      } else {
        // Login flow
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: loginType === 'admin' ? identifier : `${identifier.replace(/\./g, '').replace(/-/g, '')}@rutamax.cl`,
          password: password,
        });

        if (authError) {
          // If Supabase auth fails, check if it's a demo login
          if (identifier === 'admin@rutamax.cl' || identifier === 'demo@rutamax.cl' || (loginType === 'driver' && identifier.length > 5)) {
            console.log('Falling back to mock login for demo');
            login(loginType === 'admin' ? Role.ADMIN : Role.DRIVER, identifier);
          } else {
            setError('Credenciales inválidas o usuario no registrado.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[400px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(62,207,142,0.3)] mb-4 transition-transform hover:scale-110 duration-500">
            <Truck size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">RutaMax <span className="text-primary">TMS</span></h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.4em]">Logística de Clase Mundial</p>
        </div>

        {mode === 'login' && (
          <div className="bg-card border border-border rounded-xl p-1 flex shadow-2xl">
            <button 
              onClick={() => { setLoginType('admin'); setIdentifier(''); }}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'admin' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
            >
              Administración
            </button>
            <button 
              onClick={() => { setLoginType('driver'); setIdentifier(''); }}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'driver' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
            >
              Conductores
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
          
          <div className="space-y-5">
            <h2 className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-white mb-2">
              {mode === 'login' ? (loginType === 'admin' ? 'Acceso Corporativo' : 'Portal Conductor') : 'Crear Nueva Empresa'}
            </h2>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider leading-tight">{error}</p>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="form-label px-1">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                    <UserIcon size={16} />
                  </div>
                  <input 
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="form-input pl-10 h-12 bg-[#0a0a0a] border-border hover:border-primary/30"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="form-label px-1">
                {loginType === 'admin' || mode === 'signup' ? 'Email Corporativo' : 'RUT Conductor'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                  {loginType === 'admin' || mode === 'signup' ? <Mail size={16} /> : <UserIcon size={16} />}
                </div>
                <input 
                  required
                  type={loginType === 'admin' || mode === 'signup' ? 'email' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(loginType === 'driver' ? formatRUT(e.target.value) : e.target.value)}
                  placeholder={loginType === 'admin' || mode === 'signup' ? 'admin@rutamax.cl' : '12.345.678-K'}
                  className="form-input pl-10 h-12 bg-[#0a0a0a] border-border hover:border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label px-1">Clave de Acceso</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-10 h-12 bg-[#0a0a0a] border-border hover:border-primary/30"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-primary text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] active:scale-95 transition-all shadow-[0_10px_20px_rgba(62,207,142,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>{mode === 'login' ? 'Entrar al Sistema' : 'Registrar Empresa'} <ArrowRight size={16} /></>
            )}
          </button>
          
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
             <ShieldCheck size={14} className="text-primary" />
             <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Conexión Segura SSL-256</span>
          </div>
        </form>

        <div className="text-center">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">¿Necesitas ayuda? <span className="text-primary cursor-pointer hover:underline">Soporte Técnico</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
