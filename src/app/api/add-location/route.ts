import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { KMLLocation } from '@/app/utils/kmlParser';

export async function POST(request: Request) {
  try {
    const location: KMLLocation = await request.json();
    
    // Read the current KML file
    const kmlPath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    const kmlContent = await fs.readFile(kmlPath, 'utf-8');
    
    // Parse the KML
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    
    // Find the Document element to add our new Placemark
    const document = kml.getElementsByTagName('Document')[0];
    if (!document) {
      throw new Error('No Document element found in KML');
    }
    
    // Create new Placemark
    const placemark = kml.createElement('Placemark');
    
    // Add name
    const name = kml.createElement('name');
    name.textContent = location.name;
    placemark.appendChild(name);
    
    // Add description
    const description = kml.createElement('description');
    description.textContent = location.description || '';
    placemark.appendChild(description);
    
    // Add ExtendedData if we have additional fields
    if (location.address || location.phoneNumber || location.rating || location.descriptionUrl) {
      const extendedData = kml.createElement('ExtendedData');
      
      if (location.address) {
        const data = kml.createElement('Data');
        data.setAttribute('name', 'address');
        const value = kml.createElement('value');
        value.textContent = location.address;
        data.appendChild(value);
        extendedData.appendChild(data);
      }
      
      if (location.phoneNumber) {
        const data = kml.createElement('Data');
        data.setAttribute('name', 'phoneNumber');
        const value = kml.createElement('value');
        value.textContent = location.phoneNumber;
        data.appendChild(value);
        extendedData.appendChild(data);
      }
      
      if (location.rating) {
        const data = kml.createElement('Data');
        data.setAttribute('name', 'rating');
        const value = kml.createElement('value');
        value.textContent = location.rating.toString();
        data.appendChild(value);
        extendedData.appendChild(data);
      }
      
      if (location.descriptionUrl) {
        const data = kml.createElement('Data');
        data.setAttribute('name', 'descriptionUrl');
        const value = kml.createElement('value');
        value.textContent = location.descriptionUrl;
        data.appendChild(value);
        extendedData.appendChild(data);
      }
      
      placemark.appendChild(extendedData);
    }
    
    // Add Point with coordinates
    const point = kml.createElement('Point');
    const coordinates = kml.createElement('coordinates');
    coordinates.textContent = `${location.coordinates.lng},${location.coordinates.lat},0`;
    point.appendChild(coordinates);
    placemark.appendChild(point);
    
    // Add the new Placemark to the Document
    document.appendChild(placemark);
    
    // Serialize back to string
    const serializer = new XMLSerializer();
    const updatedKML = serializer.serializeToString(kml);
    
    // Save the file
    await fs.writeFile(kmlPath, updatedKML);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding location:', error);
    return NextResponse.json({ error: 'Failed to add location' }, { status: 500 });
  }
} 