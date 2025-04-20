import { Location } from '../types/location';
import { DOMParser, XMLSerializer, Element as XMLElement, Document as XMLDocument, Node as XMLNode } from '@xmldom/xmldom';

// Type definitions to handle both browser and xmldom types
type XMLParserResult = Document | XMLDocument;
type XMLElementType = Element | XMLElement;
type XMLNodeType = Node | XMLNode;
type XMLNodeListLike = NodeListOf<Element> | HTMLCollection | { length: number, item: (index: number) => Element | null } | { length: number, item: (index: number) => XMLElement | null };

// Helper function to get the appropriate XML parser and handle both browser and server environments
function createParser() {
  if (typeof window !== 'undefined') {
    return {
      parseFromString: (text: string): XMLParserResult => new window.DOMParser().parseFromString(text, 'text/xml')
    };
  }
  return new DOMParser();
}

// Helper function to get the appropriate XML serializer
function createSerializer() {
  if (typeof window !== 'undefined') {
    return new window.XMLSerializer();
  }
  return new XMLSerializer();
}

// Helper function to convert NodeList to Array safely
function nodeListToArray(list: XMLNodeListLike): XMLElementType[] {
  const result: XMLElementType[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list.item(i);
    if (item) {
      result.push(item);
    }
  }
  return result;
}

export interface KMLLocation {
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  rating?: number;
  descriptionUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: 'food' | 'accommodation' | 'interesting' | 'cafe' | 'bar' | 'shopping';
}

// Helper function to get address from coordinates using Google Maps Geocoding API
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return '';
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return '';
  }
}

// Function to update KML file with geocoded addresses
async function updateKMLWithAddresses(kmlText: string): Promise<string> {
  const parser = createParser();
  const kml = parser.parseFromString(kmlText, 'text/xml');
  const placemarks = nodeListToArray(kml.getElementsByTagName('Placemark'));
  const totalPlacemarks = placemarks.length;
  let processed = 0;
  
  for (const placemark of placemarks) {
    processed++;
    // Skip if address is already stored
    const extendedDataList = nodeListToArray(placemark.getElementsByTagName('ExtendedData'));
    const existingData = extendedDataList[0];
    const hasAddress = existingData && nodeListToArray(existingData.getElementsByTagName('Data')).length > 0;
    if (hasAddress) continue;

    const coordinates = getCoordinates(placemark);
    if (!coordinates) continue;

    const nameElements = nodeListToArray(placemark.getElementsByTagName('name'));
    const name = nameElements[0]?.textContent?.trim() || 'Unnamed Location';

    try {
      console.log(`Geocoding address for ${name} (${processed}/${totalPlacemarks})`);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error_message) {
        throw new Error(`Google Maps API error: ${data.error_message}`);
      }
      
      const address = data.results?.[0]?.formatted_address;
      
      if (address) {
        // Create ExtendedData if it doesn't exist
        let extendedData = existingData;
        if (!extendedData) {
          extendedData = kml.createElement('ExtendedData') as XMLElement;
          (placemark as XMLElement).appendChild(extendedData as XMLNode);
        }

        // Add address data
        const addressData = kml.createElement('Data') as XMLElement;
        addressData.setAttribute('name', 'address');
        const value = kml.createElement('value') as XMLElement;
        value.textContent = address;
        addressData.appendChild(value as XMLNode);
        (extendedData as XMLElement).appendChild(addressData as XMLNode);
        
        console.log(`✓ Successfully added address for ${name}`);
      }
    } catch (error) {
      console.error(`Failed to geocode address for ${name}:`, error);
    }
  }

  const serializer = createSerializer();
  return serializer.serializeToString(kml as unknown as XMLDocument & Document);
}

export async function loadLocationsFromKML(): Promise<KMLLocation[]> {
  try {
    const response = await fetch('/maps/saigon-food.kml');
    const kmlText = await response.text();
    
    // Check if we need to update addresses
    const parser = createParser();
    const kml = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = nodeListToArray(kml.getElementsByTagName('Placemark'));
    const needsUpdate = placemarks.some(placemark => {
      const extendedDataList = nodeListToArray(placemark.getElementsByTagName('ExtendedData'));
      const existingData = extendedDataList[0];
      return !existingData || nodeListToArray(existingData.getElementsByTagName('Data')).length === 0;
    });

    // If any placemark is missing an address, update the KML file
    if (needsUpdate) {
      console.log('Starting to update addresses in KML file...');
      console.log('This may take a few moments. Please wait...');
      
      const updatedKML = await updateKMLWithAddresses(kmlText);
      
      try {
        // Save the updated KML file
        const saveResponse = await fetch('/api/save-kml', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ kml: updatedKML }),
        });
        
        if (!saveResponse.ok) {
          throw new Error('Failed to save updated KML file');
        }
        
        console.log('✓ Successfully updated and saved KML file');
      } catch (error) {
        console.error('Failed to save KML file:', error);
        // Continue with the current data even if save fails
      }
    }

    const locations: KMLLocation[] = [];

    for (const placemark of placemarks) {
      const nameElements = nodeListToArray(placemark.getElementsByTagName('name'));
      const name = nameElements[0]?.textContent?.trim() || 'Unnamed Location';
      
      const descElement = placemark.getElementsByTagName('description')[0];
      const fullDescription = descElement?.textContent?.trim() || '';
      
      const coordinates = getCoordinates(placemark);
      if (!coordinates) continue;

      // Get address from ExtendedData
      const extendedDataList = nodeListToArray(placemark.getElementsByTagName('ExtendedData'));
      const existingData = extendedDataList[0];
      const addressData = existingData?.getElementsByTagName('Data')[0];
      const address = addressData?.getElementsByTagName('value')[0]?.textContent || '';

      let description = '';
      let phoneNumber = '';
      let rating: number | undefined;
      let descriptionUrl = '';
      let category: KMLLocation['category'] = 'interesting';

      if (fullDescription) {
        const urlMatch = fullDescription.match(/https?:\/\/[^\s<>"]+/);
        if (urlMatch) {
          descriptionUrl = urlMatch[0];
        }

        const phoneMatch = fullDescription.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) {
          phoneNumber = phoneMatch[0];
        }

        const ratingMatch = fullDescription.match(/Rating:\s*(\d+(\.\d+)?)/i);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }

        description = fullDescription
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Get category from ExtendedData
      const categoryData = nodeListToArray(existingData?.getElementsByTagName('Data') || [])
        .find(data => data.getAttribute('name') === 'category');
      if (categoryData) {
        const categoryValue = categoryData.getElementsByTagName('value')[0]?.textContent;
        if (categoryValue && ['food', 'accommodation', 'interesting', 'cafe', 'bar', 'shopping'].includes(categoryValue)) {
          category = categoryValue as KMLLocation['category'];
        }
      } else {
        category = determineCategory(description.toLowerCase());
      }

      locations.push({
        name,
        description,
        address,
        phoneNumber,
        rating,
        descriptionUrl,
        coordinates,
        category
      });
    }

    return locations;
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw error;
  }
}

// Helper function to get coordinates from a placemark
function getCoordinates(placemark: XMLElementType) {
  const coordinatesElements = nodeListToArray(placemark.getElementsByTagName('coordinates'));
  const coordinatesElement = coordinatesElements[0];
  if (!coordinatesElement || !coordinatesElement.textContent) {
    console.log('No coordinates element found');
    return null;
  }
  
  const coords = coordinatesElement.textContent.trim().split(',');
  if (coords.length < 2) {
    console.log('Invalid coordinates format');
    return null;
  }
  
  const lng = parseFloat(coords[0]);
  const lat = parseFloat(coords[1]);
  
  if (isNaN(lat) || isNaN(lng)) {
    console.log('Invalid coordinate values');
    return null;
  }
  
  return { lat, lng };
}

// Helper function to determine category based on description
function determineCategory(description: string): KMLLocation['category'] {
  if (description.includes('hotel') || 
      description.includes('hostel') || 
      description.includes('apartment') || 
      description.includes('airbnb')) {
    return 'accommodation';
  }
  
  if (description.includes('bar') || 
      description.includes('pub') || 
      description.includes('beer') || 
      description.includes('cocktail')) {
    return 'bar';
  }
  
  if (description.includes('cafe') || 
      description.includes('coffee') || 
      description.includes('cà phê')) {
    return 'cafe';
  }
  
  if (description.includes('shop') || 
      description.includes('mall') || 
      description.includes('market') || 
      description.includes('store')) {
    return 'shopping';
  }
  
  if (description.includes('restaurant') || 
      description.includes('food') || 
      description.includes('bánh') || 
      description.includes('quán') || 
      description.includes('phở') || 
      description.includes('cơm')) {
    return 'food';
  }
  
  return 'interesting';
} 