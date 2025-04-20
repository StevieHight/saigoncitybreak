export type LocationCategory = 'food' | 'cafe' | 'sight';

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  description: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  highlights: string[];
} 