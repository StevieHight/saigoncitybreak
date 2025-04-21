'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { loadLocationsFromKML, KMLLocation } from '../utils/kmlParser';
import Link from 'next/link';

// Function to normalize Vietnamese text by removing diacritics
const normalizeVietnamese = (str: string): string => {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đĐ]/g, d => d === 'đ' ? 'd' : 'D'); // Replace Vietnamese 'd'
};

const mapContainerStyle = {
  width: '100%',
  height: '70vh',
  borderRadius: '0.5rem',
};

const center = {
  lat: 10.7769,
  lng: 106.7009,
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const categoryColors = {
  food: '#000000', // Black
  accommodation: '#800080', // Purple
  interesting: '#00008B', // Dark Blue
  cafe: '#90EE90', // Light green
  bar: '#FF0000', // Red
  shopping: '#006400', // Dark green
};

const categoryLabels = {
  all: 'All Places',
  food: 'Food',
  accommodation: 'Accomm',
  interesting: 'Interesting',
  cafe: 'Cafes',
  bar: 'Bars',
  shopping: 'Shopping',
};

export default function Map() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<KMLLocation | null>(null);
  const [kmlLocations, setKmlLocations] = useState<KMLLocation[]>([]);
  const [mapError, setMapError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    console.log('Is Maps Loaded:', isLoaded);
    console.log('Load Error:', loadError);
  }, [isLoaded, loadError]);

  const loadKMLData = useCallback(async () => {
    try {
      const locations = await loadLocationsFromKML();
      setKmlLocations(locations);
    } catch (error) {
      console.error('Error loading KML locations:', error);
      setMapError('Error loading custom locations. Please try again later.');
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      loadKMLData();
    }
  }, [isLoaded, loadKMLData]);

  const filteredLocations = kmlLocations.filter(location => {
    const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
    
    const normalizedQuery = normalizeVietnamese(searchQuery.toLowerCase());
    const normalizedName = normalizeVietnamese(location.name.toLowerCase());
    const normalizedDescription = location.description ? normalizeVietnamese(location.description.toLowerCase()) : '';
    
    const matchesSearch = !searchQuery || 
      normalizedName.includes(normalizedQuery) ||
      normalizedDescription.includes(normalizedQuery);
    
    return matchesCategory && matchesSearch;
  });

  const handleMarkerClick = useCallback((location: KMLLocation) => {
    console.log('Selected location:', location);
    setSelectedLocation(location);
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center flex-col p-4 text-center">
        <p className="text-red-600 font-semibold mb-2">Error loading Google Maps</p>
        <p className="text-sm text-gray-600">
          This could be due to an invalid API key or missing API activation. 
          Please check the Google Cloud Console to ensure:
        </p>
        <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
          <li>Maps JavaScript API is enabled</li>
          <li>Billing is enabled for the project</li>
          <li>API key restrictions are properly configured</li>
        </ul>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <p>Loading maps...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Box */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        {Object.keys(categoryLabels).map(category => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedLocation(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap flex items-center gap-2 bg-white
              ${selectedCategory === category
                ? 'ring-2 ring-orange-600'
                : 'hover:bg-gray-50'
              }`}
          >
            {category !== 'all' && (
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
              />
            )}
            <span className="text-gray-700">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </span>
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={options}
        onClick={() => setSelectedLocation(null)}
        onLoad={map => {
          mapRef.current = map;
        }}
      >
        {filteredLocations.map((location, index) => (
          <Marker
            key={index}
            position={location.coordinates}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: categoryColors[location.category],
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
            onClick={() => handleMarkerClick(location)}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{
              lat: selectedLocation.coordinates.lat,
              lng: selectedLocation.coordinates.lng
            }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="max-w-xs">
              <h3 className="font-semibold text-lg mb-2">{selectedLocation.name}</h3>
              {selectedLocation.description && (
                <p className="text-gray-600 text-sm mb-2">{selectedLocation.description}</p>
              )}
              {selectedLocation.address && (
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Address:</strong> {selectedLocation.address}
                </p>
              )}
              {selectedLocation.phoneNumber && (
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Phone:</strong> {selectedLocation.phoneNumber}
                </p>
              )}
              {selectedLocation.rating && (
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Rating:</strong> {selectedLocation.rating}/5
                </p>
              )}
              <div className="flex flex-col gap-2 mt-3">
                {selectedLocation.descriptionUrl && (
                  <a
                    href={selectedLocation.descriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 text-sm"
                  >
                    More Info →
                  </a>
                )}
                {selectedLocation.blogSlug && (
                  <Link
                    href={`/blog/${selectedLocation.blogSlug}`}
                    className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                    </svg>
                    Read Blog Post
                  </Link>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {mapError && (
        <div className="absolute top-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow">
          {mapError}
        </div>
      )}
    </div>
  );
} 