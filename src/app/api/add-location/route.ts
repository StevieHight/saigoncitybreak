import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { KMLLocation } from '@/app/utils/kmlParser';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export async function POST(request: Request) {
  try {
    const location: KMLLocation = await request.json();
    console.log('Adding location:', location);
    
    // Read the current KML file
    const kmlPath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    const kmlContent = await fs.readFile(kmlPath, 'utf-8');
    
    // Parse the KML using xmldom
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    console.log('KML parsed successfully');
    
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
    if (location.address || location.phoneNumber || location.rating || location.descriptionUrl || location.blogSlug) {
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

      if (location.blogSlug) {
        const data = kml.createElement('Data');
        data.setAttribute('name', 'blogSlug');
        const value = kml.createElement('value');
        value.textContent = location.blogSlug;
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
    
    // Verify the file exists and is writable
    try {
      await fs.access(kmlPath, fs.constants.W_OK);
      console.log('KML file is writable');
    } catch (error) {
      console.error('KML file is not writable:', error);
      throw new Error('KML file is not writable');
    }
    
    // Save the file with explicit encoding and file mode
    await fs.writeFile(kmlPath, updatedKML, {
      encoding: 'utf-8',
      mode: 0o666 // Read and write for everyone
    });
    console.log('KML file saved successfully');

    // Verify the file was actually updated
    const newContent = await fs.readFile(kmlPath, 'utf-8');
    if (newContent !== updatedKML) {
      console.error('File content verification failed');
      throw new Error('File content verification failed');
    }
    console.log('File content verified');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding location:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Location data:', location);
    return NextResponse.json({ 
      error: 'Failed to add location',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 