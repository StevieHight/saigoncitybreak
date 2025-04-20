import { Location } from '../types/location';

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Ben Thanh Market',
    category: 'food',
    description: 'Historic market in the heart of Saigon, offering local cuisine and souvenirs.',
    address: 'Le Loi, Ben Thanh, District 1, Ho Chi Minh City',
    coordinates: {
      lat: 10.7721,
      lng: 106.6980,
    },
    imageUrl: '/images/ben-thanh.jpg',
    highlights: ['Street food court', 'Local handicrafts', 'Fresh produce market'],
  },
  {
    id: '2',
    name: 'The Workshop Coffee',
    category: 'cafe',
    description: 'Industrial-chic cafe known for specialty coffee and workspace environment.',
    address: '27 Ngo Duc Ke, District 1, Ho Chi Minh City',
    coordinates: {
      lat: 10.7731,
      lng: 106.7029,
    },
    imageUrl: '/images/workshop.jpg',
    highlights: ['Specialty coffee', 'Rooftop venue', 'Working space'],
  },
  {
    id: '3',
    name: 'Notre-Dame Cathedral',
    category: 'sight',
    description: 'Iconic French colonial era cathedral in downtown Saigon.',
    address: '01 Cong xa Paris, District 1, Ho Chi Minh City',
    coordinates: {
      lat: 10.7798,
      lng: 106.6990,
    },
    imageUrl: '/images/notre-dame.jpg',
    highlights: ['French architecture', 'Historic landmark', 'Photo spot'],
  },
]; 