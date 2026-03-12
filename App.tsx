
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { supabase } from './utils/supabaseClient';
import { supabaseService } from './utils/supabaseService';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import MaintenancePage from './pages/Maintenance';
import Destinations from './pages/Destinations';
import Tariffs from './pages/Tariffs';
import DriverPortal from './pages/DriverPortal';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

interface AuthContextType {
  user: User | null;
  login: (role: Role, identifier: string) => void;
  logout: () => void;
  completeOnboarding: (data: any) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rutamax_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('rutamax_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('rutamax_session');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for:', userId);
      const profileData = await supabaseService.getProfile(userId);
      
      if (profileData) {
        const newUser: User = {
          id: profileData.id,
          name: profileData.full_name || 'Usuario',
          email: profileData.email || '',
          rut: profileData.rut || '',
          phone: profileData.phone || '',
          role: profileData.role as Role,
          companyId: profileData.company_id,
          passwordSet: true,
          onboardingComplete: profileData.onboarding_complete,
          companyData: profileData.companies,
          trialStartDate: profileData.companies?.trial_start_date,
          subscriptionStatus: profileData.companies?.subscription_status as 'trial' | 'active' | 'expired'
        };
        setUser(newUser);
        localStorage.setItem('rutamax_session', JSON.stringify(newUser));
      } else {
        console.warn('No profile found for user:', userId);
        // If authenticated but no profile, we might be in a broken state
        // Let's check if we can get the email from the session at least
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const newUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || 'Usuario Nuevo',
            email: session.user.email || '',
            rut: '',
            phone: '',
            role: Role.ADMIN, // Default to admin for new signups
            companyId: '',
            passwordSet: true,
            onboardingComplete: false,
            companyData: null,
            trialStartDate: new Date().toISOString(),
            subscriptionStatus: 'trial'
          };
          setUser(newUser);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (role: Role, identifier: string) => {
    // This is now mainly for the mock/demo fallback if needed, 
    // but the primary flow is handled by onAuthStateChange
    const isMasterAdmin = identifier === 'admin@rutamax.cl';
    const isSuperMonitor = identifier === 'monitor@rutamax.cl';
    // Use a valid UUID format for demo companies to avoid DB errors
    const demoCompanyId = '00000000-0000-0000-0000-000000000000';
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: isSuperMonitor ? 'Monitor Maestro' : (role === Role.ADMIN ? (isMasterAdmin ? 'Admin Master' : 'Empresa Demo') : 'Usuario'),
      email: identifier,
      rut: '',
      phone: '',
      role: isSuperMonitor ? Role.SUPER_MONITOR : role,
      companyId: demoCompanyId,
      passwordSet: true,
      onboardingComplete: isMasterAdmin || isSuperMonitor,
      companyData: null,
      trialStartDate: new Date().toISOString(),
      subscriptionStatus: 'trial'
    };
    
    setUser(newUser);
    localStorage.setItem('rutamax_session', JSON.stringify(newUser));
  };

  const completeOnboarding = async (companyData: any) => {
    if (!user) return false;
    
    try {
      // 1. Create or update the company record
      const company = await supabaseService.addItem<any>('companies', {
        businessName: companyData.businessName,
        businessRut: companyData.businessRut,
        giro: companyData.giro,
        address: companyData.address,
        region: companyData.region,
        commune: companyData.commune,
        businessPhone: companyData.businessPhone,
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        createdBy: user.id
      });

      // 2. Update profile with company_id and onboarding_complete
      const profile = await supabaseService.upsertProfile({
        id: user.id,
        company_id: company.id,
        onboarding_complete: true,
        full_name: user.name,
        email: user.email,
        role: user.role
      });

      if (profile) {
        const updatedUser: User = { 
          ...user, 
          onboardingComplete: true, 
          companyId: company.id,
          companyData: company,
          trialStartDate: company.trialStartDate,
          subscriptionStatus: company.subscriptionStatus as 'trial' | 'active' | 'expired'
        };
        setUser(updatedUser);
        localStorage.setItem('rutamax_session', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      const message = error.message || 'Error desconocido';
      alert(`Error al activar plataforma: ${message}`);
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    try {
      await supabaseService.updateItem('profiles', user.id, updates);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('rutamax_session');
  };

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('rutamax_theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Iniciando RutaMax...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeOnboarding, updateUserProfile, isDarkMode, toggleDarkMode }}>
      <HashRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={!user ? <Landing /> : <Navigate to={user.role === Role.ADMIN ? (user.onboardingComplete ? "/dashboard" : "/onboarding") : "/portal-conductor"} />} />
          
          {user?.role === Role.ADMIN && (
            <>
              {!user.onboardingComplete ? (
                <>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="*" element={<Navigate to="/onboarding" />} />
                </>
              ) : (
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/viajes" element={<Trips />} />
                  <Route path="/reportes" element={<Reports />} />
                  <Route path="/conductores" element={<Drivers />} />
                  <Route path="/flota" element={<Fleet />} />
                  <Route path="/mantenimiento" element={<MaintenancePage />} />
                  <Route path="/destinos" element={<Destinations />} />
                  <Route path="/tarifarios" element={<Tariffs />} />
                  <Route path="/configuracion" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Route>
              )}
            </>
          )}

          {user?.role === Role.DRIVER && (
            <Route path="/portal-conductor" element={<DriverPortal />} />
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
