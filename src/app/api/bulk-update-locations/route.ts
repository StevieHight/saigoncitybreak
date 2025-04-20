import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { KMLLocation } from '@/app/utils/kmlParser';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export async function POST(request: Request) {
  try {
    const { locations, updates }: { 
      locations: KMLLocation[],
      updates: Partial<KMLLocation>
    } = await request.json();
    
    // Read the current KML file
    const kmlPath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    const kmlContent = await fs.readFile(kmlPath, 'utf-8');
    
    // Parse the KML using xmldom
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    
    // Find and update the matching placemarks
    const placemarks = kml.getElementsByTagName('Placemark');
    let updatedCount = 0;
    
    for (const placemark of Array.from(placemarks)) {
      const coordinates = placemark.getElementsByTagName('coordinates')[0];
      if (coordinates && coordinates.textContent) {
        const [lng, lat] = coordinates.textContent.trim().split(',').map(Number);
        
        // Check if this placemark matches any of our target locations
        const matchingLocation = locations.find(loc => 
          Math.abs(lat - loc.coordinates.lat) < 0.0000001 && 
          Math.abs(lng - loc.coordinates.lng) < 0.0000001
        );
        
        if (matchingLocation) {
          // Update ExtendedData
          let extendedData = placemark.getElementsByTagName('ExtendedData')[0];
          if (!extendedData) {
            extendedData = kml.createElement('ExtendedData');
            extendedData.setAttribute('xmlns', '');
            placemark.appendChild(extendedData);
          }
          
          // Update only the fields specified in updates
          Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              // Find existing Data element or create new one
              let dataElement = Array.from(extendedData.getElementsByTagName('Data'))
                .find(data => data.getAttribute('name') === key);
              
              if (!dataElement) {
                dataElement = kml.createElement('Data');
                dataElement.setAttribute('name', key);
                const valueElement = kml.createElement('value');
                dataElement.appendChild(valueElement);
                extendedData.appendChild(dataElement);
              }
              
              // Update value
              const valueElement = dataElement.getElementsByTagName('value')[0];
              valueElement.textContent = value.toString();
            }
          });
          
          updatedCount++;
        }
      }
    }
    
    if (updatedCount === 0) {
      return NextResponse.json({ error: 'No matching locations found' }, { status: 404 });
    }
    
    // Serialize back to string using xmldom
    const serializer = new XMLSerializer();
    const updatedKML = serializer.serializeToString(kml);
    
    // Save the file
    await fs.writeFile(kmlPath, updatedKML, 'utf-8');
    
    return NextResponse.json({ 
      success: true,
      updatedCount
    });
  } catch (error) {
    console.error('Error updating locations:', error);
    return NextResponse.json({ 
      error: 'Failed to update locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 