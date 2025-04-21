import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe filename
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const safeName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    
    // Save to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Ignore error if directory already exists
    }
    
    const filePath = join(uploadsDir, safeName);
    
    // Convert Buffer to Uint8Array for writeFile
    await writeFile(filePath, new Uint8Array(buffer));
    
    return NextResponse.json({ 
      url: `/uploads/${safeName}`,
      success: true 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 