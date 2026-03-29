/**
 * Fetches a raw GeoJSON driving route mapped strictly between the Tasker and Client coordinates dynamically.
 * Provides the path logic overlayed directly onto Mapbox GL instances efficiently.
 * @param {[number, number]} startCoords [lng, lat]
 * @param {[number, number]} endCoords [lng, lat]
 * @returns {Promise<any>} GeoJson Route object representing precisely calculated pathing.
 */
export const getDrivingRoute = async (startCoords, endCoords) => {
  if (!startCoords || !endCoords) return null

  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const [startLng, startLat] = startCoords
  const [endLng, endLat] = endCoords

  // Mapbox Directions API V5 explicitly demands lng before lat 
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&access_token=${token}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry
    }
    return null
  } catch (err) {
    console.error('Failed fetching Mapbox path geometry loop:', err)
    return null
  }
}
