// app/api/user/search/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

interface UserRow {
  username: string;
  tag: string;
  email: string;
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/user/search: Solicitud recibida.');

    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.warn('GET /api/user/search: No autenticado.');
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validación básica
    if (!query || query.trim().length < 1) {
      return NextResponse.json({ 
        users: [],
        message: 'Query required' 
      });
    }

    // Conectar a la base de datos Turso
    const client = getTursoClient();
    
    const searchTerm = query.trim();
    let users: UserRow[] = [];

    // Obtener información del usuario actual para excluirlo
    let currentUserEmail: string | null = null;
    if (session.user.email) {
      currentUserEmail = session.user.email;
    }

    console.log('Búsqueda iniciada para:', searchTerm);

    // Si contiene #, buscar por username+tag
    if (searchTerm.includes('#')) {
      const hashIndex = searchTerm.indexOf('#');
      const usernameQuery = searchTerm.substring(0, hashIndex).toLowerCase();
      const tagQuery = '#' + searchTerm.substring(hashIndex + 1).toLowerCase();
      
      console.log('Buscando con username:', usernameQuery, 'y tag:', tagQuery);
      
      let sql = `
        SELECT username, tag, email 
        FROM users 
        WHERE LOWER(username) LIKE ? AND LOWER(tag) LIKE ?
      `;
      const args: (string)[] = [`%${usernameQuery}%`, `%${tagQuery}%`];
      
      if (currentUserEmail) {
        sql += ' AND email != ?';
        args.push(currentUserEmail);
      }
      
      sql += ' ORDER BY username ASC LIMIT 10';
      
      const result = await client.execute({
        sql: sql,
        args: args
      });
      
      users = result.rows.map(row => ({
        username: row.username as string,
        tag: row.tag as string,
        email: row.email as string
      }));
      
    } else {
      // Buscar solo por username
      const searchTermLower = searchTerm.toLowerCase();
      console.log('Buscando username:', searchTermLower);
      
      let sql = `
        SELECT username, tag, email 
        FROM users 
        WHERE LOWER(username) LIKE ?
      `;
      const args: (string)[] = [`%${searchTermLower}%`];
      
      if (currentUserEmail) {
        sql += ' AND email != ?';
        args.push(currentUserEmail);
      }
      
      sql += ' ORDER BY username ASC LIMIT 10';
      
      const result = await client.execute({
        sql: sql,
        args: args
      });
      
      users = result.rows.map(row => ({
        username: row.username as string,
        tag: row.tag as string,
        email: row.email as string
      }));
    }

    // Si no se encontraron resultados y no hay #, también buscar en la concatenación username+tag
    if (users.length === 0 && !searchTerm.includes('#')) {
      console.log('Búsqueda secundaria en username+tag concatenado');
      
      let sql = `
        SELECT username, tag, email 
        FROM users 
        WHERE LOWER(username || tag) LIKE ?
      `;
      const searchTermLower = searchTerm.toLowerCase();
      const args: (string)[] = [`%${searchTermLower}%`];
      
      if (currentUserEmail) {
        sql += ' AND email != ?';
        args.push(currentUserEmail);
      }
      
      sql += ' ORDER BY username ASC LIMIT 10';
      
      const result = await client.execute({
        sql: sql,
        args: args
      });
      
      users = result.rows.map(row => ({
        username: row.username as string,
        tag: row.tag as string,
        email: row.email as string
      }));
    }

    console.log('Usuarios encontrados:', users.length);

    return NextResponse.json({
      users: users,
      total: users.length,
      query: searchTerm
    });

  } catch (error: any) {
    console.error('GET /api/user/search: Error CRÍTICO en la API Route (Server-side):', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { message: 'Error interno del servidor al buscar usuarios.', detail: error.message },
      { status: 500 }
    );
  }
}