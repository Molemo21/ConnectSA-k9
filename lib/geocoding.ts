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

// Address autocomplete interface
export interface AddressSuggestion {
  address: string
  displayName: string
  latitude?: number
  longitude?: number
  city?: string
  country?: string
}

// Forward geocoding - search addresses (like Uber's address search)
export async function searchAddresses(query: string, limit: number = 8): Promise<AddressSuggestion[]> {
  if (!query || query.length < 2) {
    return []
  }

  try {
    // Using OpenStreetMap Nominatim API for address search (free, no API key required)
    // Note: Nominatim has rate limits (1 request per second), so we debounce on the client side
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=${limit}&countrycodes=za&accept-language=en`,
      {
        headers: {
          'User-Agent': 'ProliinkConnect/1.0' // Required by Nominatim
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return []
    }
    
    // Transform Nominatim results to our format
    return data.map((item: any) => {
      const address = item.address || {}
      
      // Build display name
      let displayName = item.display_name || ''
      
      // Try to build a more readable address
      let readableAddress = ''
      if (address.house_number && address.road) {
        readableAddress = `${address.house_number} ${address.road}`
      } else if (address.road) {
        readableAddress = address.road
      } else {
        readableAddress = displayName.split(',')[0] // Use first part of display name
      }
      
      // Add city/suburb if available
      if (address.city || address.town || address.suburb) {
        if (readableAddress) readableAddress += ', '
        readableAddress += address.city || address.town || address.suburb
      }
      
      // Add province/state if available
      if (address.state || address.province) {
        if (readableAddress) readableAddress += ', '
        readableAddress += address.state || address.province
      }
      
      return {
        address: readableAddress || displayName,
        displayName: displayName,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: address.city || address.town || address.suburb,
        country: address.country || 'South Africa'
      }
    })
    
  } catch (error) {
    console.error('Address search error:', error)
    return []
  }
}

// Google Places Autocomplete (requires API key)
export async function searchAddressesGoogle(query: string, apiKey?: string, limit: number = 8): Promise<AddressSuggestion[]> {
  if (!apiKey || !query || query.length < 2) {
    // Fallback to Nominatim if no API key
    return searchAddresses(query, limit)
  }

  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${apiKey}&components=country:za&types=address`
    )
    
    if (!response.ok) {
      throw new Error('Google Places API error')
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.predictions || data.predictions.length === 0) {
      return []
    }
    
    // Get place details for each prediction to get coordinates
    const suggestions: AddressSuggestion[] = []
    
    for (const prediction of data.predictions.slice(0, limit)) {
      try {
        // Get place details for coordinates
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${apiKey}&fields=formatted_address,geometry,address_components`
        )
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          if (detailsData.status === 'OK' && detailsData.result) {
            const result = detailsData.result
            suggestions.push({
              address: prediction.description,
              displayName: result.formatted_address || prediction.description,
              latitude: result.geometry?.location?.lat,
              longitude: result.geometry?.location?.lng,
              city: result.address_components?.find((comp: any) => 
                comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
              )?.long_name,
              country: result.address_components?.find((comp: any) => 
                comp.types.includes('country')
              )?.long_name
            })
          }
        }
      } catch (err) {
        // If details fetch fails, still add the prediction
        suggestions.push({
          address: prediction.description,
          displayName: prediction.description
        })
      }
    }
    
    return suggestions
    
  } catch (error) {
    console.error('Google Places autocomplete error:', error)
    // Fallback to Nominatim
    return searchAddresses(query, limit)
  }
}



