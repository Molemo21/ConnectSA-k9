// Reverse geocoding utility to convert coordinates to readable addresses
export interface GeocodingResult {
  address: string
  city?: string
  country?: string
  error?: string
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
    )
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }
    
    const data = await response.json()
    
    if (!data || !data.address) {
      throw new Error('No address found for these coordinates')
    }
    
    const address = data.address
    
    // Build a readable address from the components
    let readableAddress = ''
    
    // Try to build a comprehensive address
    if (address.house_number && address.road) {
      readableAddress += `${address.house_number} ${address.road}`
    } else if (address.road) {
      readableAddress += address.road
    }
    
    if (address.suburb || address.neighbourhood) {
      if (readableAddress) readableAddress += ', '
      readableAddress += address.suburb || address.neighbourhood
    }
    
    if (address.city || address.town || address.village) {
      if (readableAddress) readableAddress += ', '
      readableAddress += address.city || address.town || address.village
    }
    
    if (address.state || address.province) {
      if (readableAddress) readableAddress += ', '
      readableAddress += address.state || address.province
    }
    
    if (address.country) {
      if (readableAddress) readableAddress += ', '
      readableAddress += address.country
    }
    
    // If we couldn't build a detailed address, use the display name
    if (!readableAddress && data.display_name) {
      readableAddress = data.display_name.split(',')[0] // Take the first part
    }
    
    // Fallback to coordinates if nothing else works
    if (!readableAddress) {
      readableAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }
    
    return {
      address: readableAddress,
      city: address.city || address.town || address.village,
      country: address.country
    }
    
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      error: error instanceof Error ? error.message : 'Failed to get address'
    }
  }
}

// Alternative geocoding using Google Maps API (requires API key)
export async function reverseGeocodeGoogle(latitude: number, longitude: number, apiKey?: string): Promise<GeocodingResult> {
  if (!apiKey) {
    return reverseGeocode(latitude, longitude) // Fallback to Nominatim
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('Google Geocoding API error')
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('No results found')
    }
    
    const result = data.results[0]
    
    return {
      address: result.formatted_address,
      city: result.address_components?.find((comp: any) => 
        comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
      )?.long_name,
      country: result.address_components?.find((comp: any) => 
        comp.types.includes('country')
      )?.long_name
    }
    
  } catch (error) {
    console.error('Google reverse geocoding error:', error)
    return reverseGeocode(latitude, longitude) // Fallback to Nominatim
  }
}



