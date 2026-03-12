-- SUPABASE SCHEMA FOR RUTAMAX TMS
-- This schema includes tables, relations, and RLS policies for a multi-tenant SaaS.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. COMPANIES TABLE
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    business_rut TEXT UNIQUE NOT NULL,
    giro TEXT,
    address TEXT,
    region TEXT,
    commune TEXT,
    business_phone TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROFILES (Linked to Auth Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT,
    rut TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'operator', 'driver', 'super_monitor')),
    avatar_url TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DRIVERS
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rut TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    license_type TEXT CHECK (license_type IN ('A2', 'A4', 'A5')),
    license_expiry DATE,
    emergency_contact TEXT,
    emergency_phone TEXT,
    blood_type TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-leave', 'inactive')),
    performance_rating INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRUCKS (Tractos)
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    fuel_type TEXT CHECK (fuel_type IN ('Diesel', 'GNC', 'Electric', 'Hybrid')),
    axles INTEGER,
    max_load_kg INTEGER,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on-trip', 'maintenance', 'out-of-service')),
    camera_url TEXT,
    has_voice BOOLEAN DEFAULT FALSE,
    current_odometer INTEGER DEFAULT 0,
    tech_review_expiry DATE,
    circulation_permit_expiry DATE,
    soap_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRAILERS (Equipos)
CREATE TABLE trailers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    type TEXT,
    brand TEXT,
    year INTEGER,
    axles INTEGER,
    capacity_kg INTEGER,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on-trip', 'maintenance')),
    rev_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DESTINATIONS (Nodos Logísticos)
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    region TEXT,
    commune TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    base_price NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TARIFFS
CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    origin_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    load_type TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'CLP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TRIPS (Operaciones)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ot_number TEXT NOT NULL,
    origin_id UUID REFERENCES destinations(id),
    destination_id UUID REFERENCES destinations(id),
    truck_id UUID REFERENCES trucks(id),
    trailer_id UUID REFERENCES trailers(id),
    driver_id UUID REFERENCES drivers(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'loading', 'in-transit', 'unloading', 'delivered', 'cancelled', 'suspended')),
    load_type TEXT,
    weight_kg INTEGER,
    seal_number TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    flete_neto NUMERIC(15,2) DEFAULT 0,
    doc_image_url TEXT,
    fuel_voucher TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. MAINTENANCE
CREATE TABLE maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Preventivo', 'Correctivo', 'Predictivo')),
    system TEXT,
    accessory TEXT,
    cost NUMERIC(15,2) DEFAULT 0,
    date DATE NOT NULL,
    odometer INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- Create Policies (Tenant Isolation)
-- Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Company Data: Users can only see data from their own company
-- We allow insert for authenticated users and select if they are linked or created it
CREATE POLICY "Companies insert" ON companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Company isolation" ON companies FOR ALL USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    created_by = auth.uid()
) WITH CHECK (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    created_by = auth.uid()
);

CREATE POLICY "Drivers isolation" ON drivers FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Trucks isolation" ON trucks FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Trailers isolation" ON trailers FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Destinations isolation" ON destinations FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tariffs isolation" ON tariffs FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Trips isolation" ON trips FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Maintenance isolation" ON maintenance FOR ALL 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 12. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trailers_updated_at BEFORE UPDATE ON trailers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 13. SEED DATA (Demo Company)
INSERT INTO companies (id, business_name, business_rut, giro, created_by)
VALUES ('00000000-0000-0000-0000-000000000000', 'Empresa Demo Rutamax', '12.345.678-9', 'Transporte de Carga', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (business_rut) DO NOTHING;

INSERT INTO profiles (id, company_id, full_name, email, role, onboarding_complete)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Usuario Demo', 'demo@rutamax.cl', 'admin', true)
ON CONFLICT (id) DO NOTHING;
