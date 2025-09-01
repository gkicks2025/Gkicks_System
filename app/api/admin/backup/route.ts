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

    const db = await getDatabase();
    
    // Get all table names
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `) as { name: string }[];

    let sqlDump = '';
    
    // Add header comment
    sqlDump += `-- GKICKS Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: SQLite\n\n`;
    
    // Disable foreign key constraints during restore
    sqlDump += `PRAGMA foreign_keys=OFF;\n\n`;
    
    for (const table of tables) {
      const tableName = table.name;
      
      // Get table schema
      const schema = await db.get(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [tableName]) as { sql: string } | undefined;
      
      if (schema) {
        sqlDump += `-- Table structure for ${tableName}\n`;
        sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlDump += `${schema.sql};\n\n`;
        
        // Get table data
        const rows = await db.all(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          sqlDump += `-- Data for table ${tableName}\n`;
          
          // Get column names
          const columns = await db.all(`PRAGMA table_info(\`${tableName}\`)`) as { name: string; type: string }[];
          const columnNames = columns.map(col => `\`${col.name}\``).join(', ');
          
          for (const row of rows) {
            const values = columns.map((col: { name: string }) => {
              const value = row[col.name];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
              }
              return value;
            }).join(', ');
            
            sqlDump += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`;
          }
          sqlDump += '\n';
        }
      }
    }
    
    // Re-enable foreign key constraints
    sqlDump += `PRAGMA foreign_keys=ON;\n`;
    
    // Create response with SQL dump
    const response = new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="gkicks-backup-${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}