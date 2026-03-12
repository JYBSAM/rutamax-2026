
export const CHILE_REGIONS = [
  {
    name: "Arica y Parinacota",
    communes: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    name: "Tarapacá",
    communes: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Huara", "Pica"]
  },
  {
    name: "Antofagasta",
    communes: ["Antofagasta", "Calama", "Mejillones", "Tocopilla", "María Elena", "Ollagüe", "San Pedro de Atacama", "Sierra Gorda", "Taltal"]
  },
  {
    name: "Atacama",
    communes: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  {
    name: "Coquimbo",
    communes: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  {
    name: "Valparaíso",
    communes: ["Valparaíso", "Viña del Mar", "Concón", "Quintero", "Puchuncaví", "Casablanca", "San Antonio", "Cartagena", "El Tabo", "El Quisco", "Algarrobo", "Santo Domingo", "Quillota", "La Cruz", "La Calera", "Nogales", "Hijuelas", "San Felipe", "Llaillay", "Putaendo", "Santa María", "Catemu", "Panquehue", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "Quilpué", "Villa Alemana", "Limache", "Olmué"]
  },
  {
    name: "Metropolitana",
    communes: ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
  },
  {
    name: "O'Higgins",
    communes: ["Rancagua", "Machalí", "Graneros", "Mostazal", "Doñihue", "Coltauco", "Coinco", "Olivar", "Pichidegua", "San Vicente", "Rengo", "San Fernando", "Pichilemu"]
  },
  {
    name: "Maule",
    communes: ["Talca", "Curicó", "Linares", "Cauquenes", "Constitución", "Molina", "Parral", "San Javier", "San Clemente", "Teno"]
  },
  {
    name: "Ñuble",
    communes: ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"]
  },
  {
    name: "Biobío",
    communes: ["Concepción", "Talcahuano", "Coronel", "Lota", "San Pedro de la Paz", "Chiguayante", "Penco", "Tomé", "Hualpén", "Los Ángeles", "Cabrero", "Laja", "Yumbel", "Arauco", "Cañete", "Lebu"]
  },
  {
    name: "La Araucanía",
    communes: ["Temuco", "Padre Las Casas", "Angol", "Lautaro", "Villarrica", "Pucón", "Victoria", "Traiguén", "Carahue", "Curacautín"]
  },
  {
    name: "Los Ríos",
    communes: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
  },
  {
    name: "Los Lagos",
    communes: ["Puerto Montt", "Puerto Varas", "Castro", "Ancud", "Quellón", "Chonchi", "Osorno", "Purranque", "Frutillar", "Llanquihue"]
  },
  {
    name: "Aysén",
    communes: ["Coyhaique", "Aysén", "Chile Chico", "Cochrane", "Guaitecas", "Lago Verde", "O'Higgins", "Tortel", "Río Ibáñez"]
  },
  {
    name: "Magallanes",
    communes: ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos", "Laguna Blanca", "Primavera", "San Gregorio", "Timaukel", "Torres del Paine"]
  }
];

export const MAINTENANCE_TYPES = ['Correctivo', 'Preventivo'];

export const MAINTENANCE_SYSTEMS = [
  'Motor', 'Transmisión', 'Frenos', 'Neumáticos', 'Suspensión', 'Sistema Eléctrico', 'Inyección', 'Carrocería'
];

export const SYSTEM_ACCESSORIES: Record<string, string[]> = {
  'Motor': ['Turbo', 'Correa Distribución', 'Bomba Agua', 'Radiador', 'Alternador'],
  'Transmisión': ['Caja Cambios', 'Embrague', 'Cardán', 'Diferencial'],
  'Frenos': ['Pastillas', 'Discos', 'Cámaras Aire', 'Válvula ABS'],
  'Neumáticos': ['Neumático Tracción', 'Neumático Dirección', 'Neumático Repuesto'],
  'Suspensión': ['Amortiguador', 'Bolsa Aire', 'Paquete Resortes', 'Bujes'],
  'Sistema Eléctrico': ['Batería', 'Focos', 'Motor Partida', 'Alternador', 'Sensores'],
  'Inyección': ['Inyectores', 'Bomba Inyección', 'Filtro Petróleo'],
  'Carrocería': ['Parabrisas', 'Espejos', 'Puertas', 'Quinta Rueda', 'Lonas']
};

export const TRUCK_BRANDS = ['Volvo', 'Scania', 'Mercedes-Benz', 'Freightliner', 'Mack', 'International', 'Foton', 'FAW', 'JAC'];
export const TRAILER_TYPES = [
  { id: 'frio', name: 'Refrigerado (Frío)' },
  { id: 'sider', name: 'Sider (Carga Seca)' },
  { id: 'plana', name: 'Plana / Abierto' },
  { id: 'tolva', name: 'Tolva / Granel' },
  { id: 'tanque', name: 'Tanque / Líquidos' },
  { id: 'camabaja', name: 'Cama Baja' },
  { id: 'portacontenedor', name: 'Portacontenedor' }
];

export const LOAD_TYPES = [
  { id: 'general', name: 'Carga General', icon: '📦' },
  { id: 'refrigerada', name: 'Refrigerada', icon: '❄️' },
  { id: 'imo', name: 'Peligrosa (IMO)', icon: '⚠️' }
];

export const PLANS = [
  { id: 'basic', name: 'Básico', price: 19, features: ['Hasta 5 Camiones', 'Viajes', 'Soporte Email'] },
  { id: 'standard', name: 'Estándar', price: 25, features: ['Hasta 15 Camiones', 'Mantenimiento', 'OCR Doc'] },
  { id: 'enterprise', name: 'Pro', price: 60, features: ['Ilimitado', 'IA Avanzada', 'API'] }
];
