import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { KMLLocation } from '@/app/utils/kmlParser';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export async function POST(request: Request) {
  try {
    const location: KMLLocation = await request.json();
    console.log('Deleting location:', location);
    
    // Read the current KML file
    const kmlPath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    const kmlContent = await fs.readFile(kmlPath, 'utf-8');
    
    // Parse the KML using xmldom
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    
    // Find and remove the matching placemark
    const placemarks = kml.getElementsByTagName('Placemark');
    let found = false;
    
    for (const placemark of Array.from(placemarks)) {
      const coordinates = placemark.getElementsByTagName('coordinates')[0];
      if (coordinates && coordinates.textContent) {
        const [lng, lat] = coordinates.textContent.trim().split(',').map(Number);
        
        if (Math.abs(lat - location.coordinates.lat) < 0.0000001 && 
            Math.abs(lng - location.coordinates.lng) < 0.0000001) {
          console.log('Found matching placemark to delete');
          placemark.parentNode?.removeChild(placemark);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    // Serialize back to string using xmldom
    const serializer = new XMLSerializer();
    const updatedKML = serializer.serializeToString(kml);
    
    // Save the file
    await fs.writeFile(kmlPath, updatedKML, 'utf-8');
    console.log('Successfully deleted location from KML file');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
} 