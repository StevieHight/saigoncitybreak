import { KMLLocation } from './kmlParser';

export const createTestLocation = (overrides: Partial<KMLLocation> = {}): KMLLocation => {
  return {
    name: "Test Restaurant",
    description: "A great place to eat",
    address: "123 Test Street, District 1",
    phoneNumber: "+84 28 1234 5678",
    rating: 4.5,
    descriptionUrl: "https://example.com/test-restaurant",
    coordinates: {
      lat: 10.7769,
      lng: 106.7009
    },
    category: "food",
    ...overrides
  };
};

export const sampleLocations = [
  createTestLocation({
    name: "Pho Test Restaurant",
    description: "Famous for traditional Vietnamese pho",
    address: "123 Le Loi Street, District 1",
    category: "food"
  }),
  
  createTestLocation({
    name: "Test Cafe",
    description: "Cozy cafe with great coffee",
    address: "456 Nguyen Hue Street, District 1",
    category: "cafe",
    coordinates: {
      lat: 10.7731,
      lng: 106.7029
    }
  }),
  
  createTestLocation({
    name: "Shopping Center",
    description: "Modern shopping mall",
    address: "789 Le Thanh Ton Street, District 1",
    category: "shopping",
    coordinates: {
      lat: 10.7791,
      lng: 106.7039
    }
  })
];

// Helper function to add a location via API
export const addLocation = async (location: KMLLocation) => {
  const response = await fetch('/api/add-location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location)
  });
  return response.json();
};

// Helper function to edit a location via API
export const editLocation = async (location: KMLLocation) => {
  const response = await fetch('/api/update-location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location)
  });
  return response.json();
};

// Helper function to delete a location via API
export const deleteLocation = async (coordinates: { lat: number; lng: number }) => {
  const response = await fetch('/api/delete-location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates })
  });
  return response.json();
}; 