import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename parameter is required' }, { status: 400 });
    }
    
    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Construct the file path
    const filePath = join(process.cwd(), 'public', 'uploads', '3d-models', filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'glb':
        contentType = 'model/gltf-binary';
        break;
      case 'gltf':
        contentType = 'model/gltf+json';
        break;
      case 'obj':
        contentType = 'text/plain';
        break;
      case 'mtl':
        contentType = 'text/plain';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
    }
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
      },
    });
    
  } catch (error) {
    console.error('Error serving 3D model file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // Handle HEAD requests for file existence checks
  return GET(request);
}