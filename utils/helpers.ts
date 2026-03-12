
export const formatRUT = (rut: string): string => {
  // Solo permite números y K, máximo 9 caracteres (ej: 18433555K)
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  return clean.slice(0, 9);
};

export const formatPhone = (phone: string): string => {
  // Limpia todo lo que no sea número
  let digits = phone.replace(/\D/g, '');
  
  // Si el usuario incluyó el 569 al inicio, lo quitamos para normalizar
  if (digits.startsWith('569')) {
    digits = digits.slice(3);
  }
  
  // Tomamos solo los últimos 8 dígitos (el número móvil en Chile)
  const mobileNumber = digits.slice(0, 8);
  
  // Retornamos siempre con el prefijo +569 y máximo 8 dígitos adicionales
  return mobileNumber ? `+569${mobileNumber}` : '+569';
};

export const validateRUT = (rut: string): boolean => {
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  if (cleanRUT.length < 8) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toLowerCase();
  
  let m = 0, s = 1;
  let t = parseInt(body);
  if (isNaN(t)) return false;

  for (; t; t = Math.floor(t / 10)) {
    s = (s + t % 10 * (9 - m++ % 6)) % 11;
  }
  
  const expectedDv = s ? (s - 1).toString() : 'k';
  return expectedDv === dv;
};

export const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
});

export const getDaysRemaining = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, 14 - diffDays);
};
