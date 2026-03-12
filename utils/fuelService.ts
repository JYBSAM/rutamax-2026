
/**
 * Simulación de consumo de API de la Comisión Nacional de Energía (CNE Chile)
 * En un entorno real se usaría: https://api.cne.cl/v1/combustibles/...
 */
export const getDieselPriceChile = async (region: string = "Metropolitana"): Promise<number> => {
  try {
    // Simulamos un delay de red y el valor promedio actual en Chile
    // Diesel aprox $1.050 - $1.150 CLP
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(1085); // Precio promedio Diesel hoy
      }, 500);
    });
  } catch (error) {
    console.error("Error fetching fuel price", error);
    return 1080; // Fallback
  }
};
