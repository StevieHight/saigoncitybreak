export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceGeometry {
  type: 'Point' | 'LineString';
  coordinates: Coordinates | Coordinates[];
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  address: string;
  geometry: PlaceGeometry;
  type: 'FOOD_STREET' | 'MARKET' | 'RESTAURANT' | 'LANDMARK';
  externalLinks?: string[];
  district?: string;
}

export interface FoodStreet extends Place {
  type: 'FOOD_STREET';
  specialties?: string[];
  bestTimeToVisit?: string;
} 