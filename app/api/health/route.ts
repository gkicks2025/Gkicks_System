import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/database/mysql-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check endpoint called');
    
    // Check database health
    const dbHealth = await healthCheck();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    console.log('✅ Health check successful:', healthData);
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    };
    
    return NextResponse.json(errorData, { status: 503 });
  }
}