import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }
    
    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'payment-screenshots', filename)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.bmp':
        contentType = 'image/bmp'
        break
      case '.tiff':
      case '.tif':
        contentType = 'image/tiff'
        break
      case '.avif':
        contentType = 'image/avif'
        break
    }
    
    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving payment screenshot:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}