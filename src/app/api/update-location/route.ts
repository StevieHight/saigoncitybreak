import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { KMLLocation } from '@/app/utils/kmlParser';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export async function POST(request: Request) {
  try {
    const location: KMLLocation = await request.json();
    console.log('Updating location:', location);
    
    // Read the current KML file
    const kmlPath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    console.log('Reading KML file from:', kmlPath);
    
    const kmlContent = await fs.readFile(kmlPath, 'utf-8');
    console.log('KML file read successfully');
    
    // Parse the KML using xmldom
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    console.log('KML parsed successfully');
    
    // Find the matching placemark
    const placemarks = kml.getElementsByTagName('Placemark');
    console.log('Total placemarks found:', placemarks.length);
    let found = false;
    
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const coordinates = placemark.getElementsByTagName('coordinates')[0];
      if (coordinates && coordinates.textContent) {
        const [lng, lat] = coordinates.textContent.trim().split(',').map(Number);
        
        if (Math.abs(lat - location.coordinates.lat) < 0.0000001 && 
            Math.abs(lng - location.coordinates.lng) < 0.0000001) {
          console.log('Found matching placemark at index:', i);
          
          // Update name (handle both <n> and <name> tags)
          let nameElement = placemark.getElementsByTagName('n')[0] || placemark.getElementsByTagName('name')[0];
          if (!nameElement) {
            nameElement = kml.createElement('n');
            placemark.appendChild(nameElement);
          }
          nameElement.textContent = location.name;
          console.log('Updated name to:', location.name);
          
          // Update description
          let description = placemark.getElementsByTagName('description')[0];
          if (!description) {
            description = kml.createElement('description');
            placemark.appendChild(description);
          }
          description.textContent = location.description || '';
          console.log('Updated description');
          
          // Update or create ExtendedData with xmlns attribute
          let extendedData = placemark.getElementsByTagName('ExtendedData')[0];
          if (!extendedData) {
            extendedData = kml.createElement('ExtendedData');
            extendedData.setAttribute('xmlns', '');
            placemark.appendChild(extendedData);
          } else if (!extendedData.getAttribute('xmlns')) {
            extendedData.setAttribute('xmlns', '');
          }
          
          // Clear existing ExtendedData
          while (extendedData.firstChild) {
            extendedData.removeChild(extendedData.firstChild);
          }
          
          // Add updated ExtendedData fields
          const fields = {
            address: location.address,
            phoneNumber: location.phoneNumber,
            rating: location.rating?.toString(),
            descriptionUrl: location.descriptionUrl,
            category: location.category,
            blogSlug: location.blogSlug
          };
          
          for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined && value !== null) { // Include empty strings but not undefined/null
              const data = kml.createElement('Data');
              data.setAttribute('name', key);
              const valueElement = kml.createElement('value');
              valueElement.textContent = value;
              data.appendChild(valueElement);
              extendedData.appendChild(data);
              console.log(`Added ${key} with value:`, value);
            }
          }
          
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      console.log('No matching placemark found');
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    // Serialize back to string using xmldom
    const serializer = new XMLSerializer();
    const updatedKML = serializer.serializeToString(kml);
    console.log('KML serialized successfully');
    
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
    console.error('Error updating location:', error);
    return NextResponse.json({ 
      error: 'Failed to update location',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 