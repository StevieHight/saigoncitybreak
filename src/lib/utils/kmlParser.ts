import { Place, Coordinates, PlaceGeometry } from '../types/places';

export function parseKMLCoordinates(coordinateString: string): Coordinates {
  const [lng, lat] = coordinateString.split(',').map(Number);
  return { lat, lng };
}

export function parseKMLGeometry(geometryNode: Element): PlaceGeometry {
  const type = geometryNode.tagName === 'Point' ? 'Point' : 'LineString';
  const coordinatesText = geometryNode.querySelector('coordinates')?.textContent || '';
  
  if (type === 'Point') {
    return {
      type,
      coordinates: parseKMLCoordinates(coordinatesText.trim())
    };
  }

  // Handle LineString
  const coordinates = coordinatesText
    .trim()
    .split(' ')
    .map(coord => parseKMLCoordinates(coord));

  return {
    type,
    coordinates
  };
}

export function parseKMLPlacemark(placemarkNode: Element): Partial<Place> {
  const name = placemarkNode.querySelector('name')?.textContent || '';
  const descriptionElement = placemarkNode.querySelector('description');
  const description = descriptionElement?.textContent || undefined;
  const address = placemarkNode.querySelector('address')?.textContent || '';
  
  // Parse geometry
  const geometryNode = placemarkNode.querySelector('Point, LineString');
  const geometry = geometryNode ? parseKMLGeometry(geometryNode) : undefined;

  // Extract external links from description if they exist
  const externalLinks = description?.match(/href="([^"]+)"/g)?.map(link => 
    link.replace(/href="|"/g, '')
  );

  return {
    name,
    description,
    address,
    geometry,
    externalLinks,
    // Default to RESTAURANT type, can be updated later based on specific criteria
    type: 'RESTAURANT' as const
  };
}

export function parseKMLDocument(kmlText: string): Partial<Place>[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
  const placemarks = Array.from(xmlDoc.getElementsByTagName('Placemark'));
  
  return placemarks.map(placemark => parseKMLPlacemark(placemark));
} 