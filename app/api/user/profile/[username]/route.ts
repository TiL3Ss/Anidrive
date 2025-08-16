// app/api/user/profile/[username]/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

interface UserProfileRow {
  id: number;
  username: string;
  tag: string;
  email: string;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // ARREGLO: Await params antes de usar sus propiedades
    const resolvedParams = await params;
    console.log('GET /api/user/profile/[username]: Solicitud recibida para usuario:', resolvedParams.username);

    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.warn('GET /api/user/profile/[username]: No autenticado.');
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { username } = resolvedParams;

    if (!username) {
      return NextResponse.json(
        { error: 'Username requerido' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos SQLite
    const db = await getDb();

    // Buscar el usuario por username (sin el tag)
    const userQuery = `
      SELECT id, username, tag, email, created_at
      FROM users 
      WHERE LOWER(username) = LOWER(?)
      LIMIT 1
    `;

    const user = await db.get<UserProfileRow>(userQuery, [username]);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Contar los animes del usuario
    const animeCountQuery = `
      SELECT COUNT(*) as count
      FROM user_animes
      WHERE user_id = ?
    `;

    const animeCountResult = await db.get<{ count: number }>(animeCountQuery, [user.id]);
    const animeCount = animeCountResult?.count || 0;

    // Verificar si es el perfil del usuario actual
    const isOwnProfile = session.user.email === user.email;

    const userProfile = {
      id: user.id,
      username: user.username,
      tag: user.tag,
      email: user.email, // Solo incluir email si es el propio perfil
      created_at: user.created_at,
      animeCount: animeCount,
      isOwnProfile: isOwnProfile
    };

    // Si no es el propio perfil, no incluir información sensible
    if (!isOwnProfile) {
      delete (userProfile as any).email;
    }

    console.log('Usuario encontrado:', user.username, 'Animes:', animeCount);

    return NextResponse.json(userProfile);

  } catch (error: any) {
    console.error('GET /api/user/profile/[username]: Error CRÍTICO:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { message: 'Error interno del servidor al obtener el perfil.', detail: error.message },
      { status: 500 }
    );
  }
}