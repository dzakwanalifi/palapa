/**
 * OpenWeatherMap Weather API Client for PALAPA (Free Plan Compatible)
 * Handles weather forecasting, caching, and data transformation using free-tier APIs
 */

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeatherData {
  coord: { lon: number; lat: number };
  weather: WeatherCondition[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastWeatherData {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: WeatherCondition[];
  clouds: { all: number };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility: number;
  pop?: number; // Probability of precipitation (free plan might not have this)
  rain?: { '3h': number };
  snow?: { '3h': number };
  dt_txt: string;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastWeatherData[];
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface WeatherForecast {
  location: {
    lat: number;
    lon: number;
    timezone: string;
    name: string;
    country: string;
  };
  current: CurrentWeatherData;
  forecast: {
    '5day': ForecastWeatherData[]; // 5-day forecast with 3-hour intervals
  };
}

export interface WeatherCacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export class WeatherCache {
  private cache = new Map<string, WeatherCacheEntry>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 120) { // 2 hours default
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.ttlMs
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class OpenWeatherMapClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: WeatherCache;

  constructor(apiKey: string, cacheTtlMinutes: number = 120) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new WeatherCache(cacheTtlMinutes);
  }

  /**
   * Get current weather data
   */
  async getCurrentWeather(
    lat: number,
    lon: number,
    units: 'standard' | 'metric' | 'imperial' = 'metric'
  ): Promise<CurrentWeatherData> {
    const cacheKey = `current_${lat}_${lon}_${units}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.apiKey,
      units: units
    });

    const url = `${this.baseUrl}/weather?${params}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  /**
   * Get 5-day weather forecast (3-hour intervals)
   */
  async getForecast(
    lat: number,
    lon: number,
    units: 'standard' | 'metric' | 'imperial' = 'metric'
  ): Promise<ForecastResponse> {
    const cacheKey = `forecast_${lat}_${lon}_${units}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.apiKey,
      units: units
    });

    const url = `${this.baseUrl}/forecast?${params}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  /**
   * Get weather data for itinerary planning (free plan compatible)
   */
  async getItineraryWeather(
    lat: number,
    lon: number,
    days: number = 5 // Free plan only supports 5-day forecast
  ): Promise<WeatherForecast> {
    // Get current weather and forecast in parallel
    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(lat, lon, 'metric'),
      this.getForecast(lat, lon, 'metric')
    ]);

    // Group forecast by days (3-hour intervals, so 8 entries per day)
    const dailyForecasts: ForecastWeatherData[] = [];
    const dayCount = Math.min(days, 5); // Free plan limit

    for (let day = 0; day < dayCount; day++) {
      // Get forecast entries for this day (8 entries per day, starting from index 0)
      const dayStartIndex = day * 8;
      const dayEndIndex = Math.min((day + 1) * 8, forecast.list.length);

      if (dayStartIndex < forecast.list.length) {
        const dayEntries = forecast.list.slice(dayStartIndex, dayEndIndex);

        // Use midday forecast (around index 4) as representative for the day
        const middayIndex = Math.min(4, dayEntries.length - 1);
        dailyForecasts.push(dayEntries[middayIndex]);
      }
    }

    return {
      location: {
        lat: current.coord.lat,
        lon: current.coord.lon,
        timezone: forecast.city.timezone.toString(),
        name: forecast.city.name,
        country: forecast.city.country
      },
      current,
      forecast: {
        '5day': forecast.list // Return all 3-hour intervals
      }
    };
  }

  /**
   * Check if weather is suitable for outdoor activities (free plan compatible)
   */
  isGoodWeatherForActivities(weather: ForecastWeatherData): {
    suitable: boolean;
    reasons: string[];
    score: number; // 0-100, higher is better
  } {
    const reasons: string[] = [];
    let score = 100;

    // Temperature check (ideal: 15-30°C)
    const temp = weather.main.temp;
    if (temp < 10) {
      reasons.push('Too cold');
      score -= 40;
    } else if (temp > 35) {
      reasons.push('Too hot');
      score -= 30;
    } else if (temp < 15 || temp > 30) {
      reasons.push('Temperature not ideal');
      score -= 15;
    }

    // Rain probability (free plan might not have pop, use rain amount)
    if (weather.rain && weather.rain['3h'] > 5) {
      reasons.push('Heavy rain expected');
      score -= 50;
    } else if (weather.rain && weather.rain['3h'] > 1) {
      reasons.push('Light rain possible');
      score -= 25;
    }

    // Wind speed (ideal: < 10 m/s)
    if (weather.wind.speed > 15) {
      reasons.push('Very windy');
      score -= 30;
    } else if (weather.wind.speed > 10) {
      reasons.push('Windy');
      score -= 15;
    }

    // Cloud cover (free plan approximation)
    if (weather.clouds.all > 80) {
      reasons.push('Very cloudy');
      score -= 10;
    }

    const suitable = score >= 60;

    return {
      suitable,
      reasons: suitable && reasons.length === 0 ? ['Good weather'] : reasons,
      score: Math.max(0, Math.min(100, score))
    };
  }

  /**
   * Get weather recommendations for itinerary (free plan compatible)
   */
  async getItineraryWeatherRecommendations(
    destinations: Array<{ lat: number; lon: number; name: string; date?: string }>
  ): Promise<Array<{
    destination: string;
    date: string;
    weather: ForecastWeatherData | null;
    overview: string | null;
    suitability: {
      suitable: boolean;
      reasons: string[];
      score: number;
    } | null;
  }>> {
    const recommendations = [];

    for (const dest of destinations) {
      try {
        // Get weather forecast for this location
        const forecast = await this.getItineraryWeather(dest.lat, dest.lon, 1);

        // Find forecast data closest to the requested date
        let selectedWeather: ForecastWeatherData | null = null;
        let suitability = null;

        if (forecast.forecast['5day'].length > 0) {
          // Use midday forecast from first day as representative
          const dayForecasts = forecast.forecast['5day'].slice(0, 8); // First day
          const middayIndex = Math.min(4, dayForecasts.length - 1); // Around midday
          selectedWeather = dayForecasts[middayIndex];

          // Calculate suitability
          suitability = this.isGoodWeatherForActivities(selectedWeather);
        }

        // Generate simple text overview (since AI overview requires paid plan)
        const overview = selectedWeather ?
          `${selectedWeather.weather[0].description}, ${Math.round(selectedWeather.main.temp)}°C` :
          null;

        recommendations.push({
          destination: dest.name,
          date: dest.date || new Date().toISOString().split('T')[0],
          weather: selectedWeather,
          overview,
          suitability
        });
      } catch (error) {
        console.error(`Error getting weather for ${dest.name}:`, error);
        recommendations.push({
          destination: dest.name,
          date: dest.date || new Date().toISOString().split('T')[0],
          weather: null,
          overview: null,
          suitability: null
        });
      }
    }

    return recommendations;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size()
    };
  }
}

// Export default instance (requires API key from env)
export const weatherClient = new OpenWeatherMapClient(
  process.env.OPENWEATHER_API_KEY || '',
  120 // 2 hour cache
);
