import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { kml } = await request.json();
    
    // Save to the public directory
    const filePath = path.join(process.cwd(), 'public', 'maps', 'saigon-food.kml');
    await fs.writeFile(filePath, kml);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving KML file:', error);
    return NextResponse.json({ error: 'Failed to save KML file' }, { status: 500 });
  }
} 