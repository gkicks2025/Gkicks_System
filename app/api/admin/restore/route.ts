import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/sqlite';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin permissions (you may want to add proper auth check)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get('backup') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.db')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .sql and .db files are allowed.' },
        { status: 400 }
      );
    }
    
    // Read file content
    const fileContent = await file.text();
    
    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: 'Backup file is empty' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    
    // Begin transaction for atomic restore
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Disable foreign key constraints during restore
      await db.run('PRAGMA foreign_keys=OFF');
      
      // Split SQL content into individual statements
      const statements = fileContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.run(statement);
          } catch (stmtError) {
            console.error('Statement error:', statement, stmtError);
            // Continue with other statements, but log the error
          }
        }
      }
      
      // Re-enable foreign key constraints
      await db.run('PRAGMA foreign_keys=ON');
      
      // Commit transaction
      await db.run('COMMIT');
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Database restored successfully',
          statementsExecuted: statements.length
        },
        { status: 200 }
      );
      
    } catch (restoreError) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw restoreError;
    }
    
  } catch (error) {
    console.error('Restore error:', error);
    
    // Determine error message based on error type
    let errorMessage = 'Failed to restore database';
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_CORRUPT')) {
        errorMessage = 'Backup file appears to be corrupted';
      } else if (error.message.includes('syntax error')) {
        errorMessage = 'Invalid SQL syntax in backup file';
      } else if (error.message.includes('no such table')) {
        errorMessage = 'Backup file structure does not match current database';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to validate SQL content
function isValidSQLBackup(content: string): boolean {
  // Basic validation - check for common SQL keywords
  const sqlKeywords = ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE'];
  return sqlKeywords.some(keyword => content.toUpperCase().includes(keyword));
}