import { API_CONFIG } from '../config/ApiConfig';

export interface DisasterAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startTime: Date;
  endTime?: Date;
  source: string;
  affectedAreas?: string[];
  distance?: number; // Distance from user in km
}

export class DisasterAlertService {
  
  /**
   * Fetch disaster alerts from NASA EONET
   * Free, no API key required!
   */
  static async fetchNASAAlerts(
    latitude?: number,
    longitude?: number,
    radiusKm: number = 500
  ): Promise<DisasterAlert[]> {
    try {
      console.log('🛰️ Fetching NASA EONET alerts...');
      
      // India bounding box: 68°E to 97°E, 7°N to 37°N
      const bbox = latitude && longitude
        ? `${longitude - 5},${latitude - 5},${longitude + 5},${latitude + 5}`
        : '68,7,97,37'; // Default: All India

      const response = await fetch(
        `https://eonet.gsfc.nasa.gov/api/v3/events?bbox=${bbox}&status=open&days=30`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ NASA: Found ${data.events?.length || 0} events`);
      
      const alerts = data.events?.map((event: any) => {
        const coords = event.geometry?.[0]?.coordinates || [0, 0];
        const alertLat = coords[1];
        const alertLon = coords[0];
        
        const distance = latitude && longitude
          ? this.calculateDistance(latitude, longitude, alertLat, alertLon)
          : 0;

        return {
          id: event.id,
          title: event.title,
          description: event.description || event.title,
          category: this.mapNASACategory(event.categories?.[0]?.title || 'Unknown'),
          severity: this.calculateSeverity(event),
          location: {
            latitude: alertLat,
            longitude: alertLon,
          },
          startTime: new Date(event.geometry?.[0]?.date || new Date()),
          source: 'NASA EONET',
          affectedAreas: event.sources?.map((s: any) => s.id) || [],
          distance: Math.round(distance),
        };
      }) || [];
      
      return alerts;
      
    } catch (error) {
      console.error('❌ NASA Alert fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch earthquake alerts from USGS
   * Free, no API key required!
   */
  static async fetchEarthquakeAlerts(
    minMagnitude: number = 3.0,
    days: number = 30
  ): Promise<DisasterAlert[]> {
    try {
      console.log('🌍 Fetching USGS earthquake alerts...');
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - days);
      
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
        `&starttime=${startTime.toISOString().split('T')[0]}` +
        `&minlatitude=7&maxlatitude=37` +
        `&minlongitude=68&maxlongitude=97` +
        `&minmagnitude=${minMagnitude}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ USGS: Found ${data.features?.length || 0} earthquakes`);
      
      const alerts = data.features?.map((feature: any) => ({
        id: feature.id,
        title: feature.properties.title,
        description: `Magnitude ${feature.properties.mag} earthquake at depth ${Math.round(feature.geometry.coordinates[2])} km`,
        category: 'Earthquake',
        severity: this.getEarthquakeSeverity(feature.properties.mag),
        location: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          address: feature.properties.place,
        },
        startTime: new Date(feature.properties.time),
        source: 'USGS',
        distance: 0,
      })) || [];
      
      return alerts;
      
    } catch (error) {
      console.error('❌ USGS Alert fetch error:', error);
      return [];
    }
  }

  /**
   * Get all disaster alerts (combined sources)
   */
  static async getAllAlerts(
    latitude?: number,
    longitude?: number,
    radiusKm: number = 500
  ): Promise<DisasterAlert[]> {
    try {
      console.log(`🔍 Fetching all alerts for location: ${latitude}, ${longitude}`);
      
      const [nasaAlerts, earthquakeAlerts] = await Promise.all([
        this.fetchNASAAlerts(latitude, longitude),
        this.fetchEarthquakeAlerts(3.0, 30),
      ]);

      // Combine all alerts
      let allAlerts = [...nasaAlerts, ...earthquakeAlerts];
      
      // Calculate distance for earthquake alerts if user location provided
      if (latitude && longitude) {
        allAlerts = allAlerts.map(alert => ({
          ...alert,
          distance: Math.round(
            this.calculateDistance(
              latitude,
              longitude,
              alert.location.latitude,
              alert.location.longitude
            )
          ),
        }));

        // Filter by radius
        allAlerts = allAlerts.filter(alert => alert.distance! <= radiusKm);
      }
      
      // Sort by severity (critical first) then by distance
      allAlerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return (a.distance || 0) - (b.distance || 0);
      });

      console.log(`✅ Total alerts found: ${allAlerts.length} (within ${radiusKm}km)`);
      
      return allAlerts;
      
    } catch (error) {
      console.error('❌ Error fetching all alerts:', error);
      return [];
    }
  }

  /**
   * Get alerts for user's region (state/district level)
   */
  static async getRegionalAlerts(
    userState: string,
    userCity: string,
    latitude?: number,
    longitude?: number
  ): Promise<DisasterAlert[]> {
    const allAlerts = await this.getAllAlerts(latitude, longitude, 300); // 300km radius
    
    // Filter alerts that are close to user or mention their region
    return allAlerts.filter(alert => {
      const isNearby = alert.distance! <= 200; // Within 200km
      const mentionsRegion = 
        alert.title.toLowerCase().includes(userState.toLowerCase()) ||
        alert.title.toLowerCase().includes(userCity.toLowerCase()) ||
        alert.location.address?.toLowerCase().includes(userState.toLowerCase()) ||
        alert.location.address?.toLowerCase().includes(userCity.toLowerCase());
      
      return isNearby || mentionsRegion;
    });
  }

  /**
   * Check if alert affects user's location
   */
  static isAlertNearby(
    alert: DisasterAlert,
    userLat: number,
    userLon: number,
    radiusKm: number = 100
  ): boolean {
    const distance = this.calculateDistance(
      userLat,
      userLon,
      alert.location.latitude,
      alert.location.longitude
    );
    return distance <= radiusKm;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Map NASA category to app category
   */
  private static mapNASACategory(nasaCategory: string): string {
    const mapping: { [key: string]: string } = {
      'Wildfires': 'Fire',
      'Severe Storms': 'Storm',
      'Floods': 'Flood',
      'Drought': 'Drought',
      'Earthquakes': 'Earthquake',
      'Volcanoes': 'Volcano',
      'Landslides': 'Landslide',
      'Sea and Lake Ice': 'Ice',
      'Snow': 'Snow',
      'Dust and Haze': 'Dust Storm',
    };
    return mapping[nasaCategory] || nasaCategory;
  }

  /**
   * Calculate severity based on event data
   */
  private static calculateSeverity(event: any): 'low' | 'medium' | 'high' | 'critical' {
    const category = event.categories?.[0]?.title || '';
    
    if (category === 'Earthquakes' || category === 'Volcanoes') {
      return 'critical';
    }
    if (category === 'Severe Storms' || category === 'Floods') {
      return 'high';
    }
    if (category === 'Wildfires' || category === 'Landslides') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get earthquake severity based on magnitude
   */
  private static getEarthquakeSeverity(magnitude: number): 'low' | 'medium' | 'high' | 'critical' {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 4.5) return 'medium';
    return 'low';
  }

  /**
   * Get severity color
   */
  static getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const colors = {
      low: '#4CAF50',      // Green
      medium: '#FF9800',   // Orange
      high: '#FF5722',     // Deep Orange
      critical: '#D32F2F', // Red
    };
    return colors[severity];
  }

  /**
   * Get category icon
   */
  static getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Earthquake': '🌍',
      'Flood': '🌊',
      'Fire': '🔥',
      'Storm': '⛈️',
      'Cyclone': '🌀',
      'Tsunami': '🌊',
      'Landslide': '⛰️',
      'Drought': '☀️',
      'Volcano': '🌋',
      'Snow': '❄️',
      'Dust Storm': '💨',
      'Ice': '🧊',
    };
    return icons[category] || '⚠️';
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    }
    return `${Math.round(distanceKm)}km away`;
  }

  /**
   * Get time ago string
   */
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  }
}
