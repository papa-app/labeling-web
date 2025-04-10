const getElevation = async (lat, lng) => {
  const apiKey = "AIzaSyDNiT9EmehnlkovSu5tPofwUcZAmtBbgQ0"; // asegúrate de tener habilitada la API de Elevation
  const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].elevation;
    } else {
      throw new Error("No se encontró elevación");
    }
  } catch (error) {
    console.error("Error al obtener la elevación:", error);
    return null;
  }
};
