import axios from 'axios';

/**
 * @interface GeoLocationResponse
 * @description Defines the structure of the successful response from the GeoJS API.
 */
export interface GeoLocationResponse {
  country: string;
  country_code: string;
  country_code3: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  timezone: string;
  ip: string;
  organization: string;
  organization_name: string;
  asn: string;
}

/**
 * Fetches the geolocation of an IP address using the GeoJS API.
 * @param {string} ip The IP address to geolocate.
 * @returns {Promise<GeoLocationResponse | null>} A promise that resolves to the geolocation data, or null if an error occurs.
 */
async function getPeerGeoLocation(ip: string): Promise<GeoLocationResponse | null> {
  const endpoint = `https://get.geojs.io/v1/ip/geo/${ip}.json`;
  try {
    const response = await axios.get<GeoLocationResponse>(endpoint);
    return response.data;
  } catch (error) {
    console.error(`GeoJS API error for IP ${ip}:`, error);
    return null;
  }
}

export {
  getPeerGeoLocation,
};
