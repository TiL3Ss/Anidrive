// app/api/user/profile/[username]/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
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

    // Conectar a la base de datos Turso
    const client = getTursoClient();

    // Buscar el usuario por username (sin el tag)
    const userResult = await client.execute({
      sql: `
        SELECT id, username, tag, email, created_at
        FROM users 
        WHERE LOWER(username) = LOWER(?)
        LIMIT 1
      `,
      args: [username]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userRow = userResult.rows[0];
    const user: UserProfileRow = {
      id: userRow.id as number,
      username: userRow.username as string,
      tag: userRow.tag as string,
      email: userRow.email as string,
      created_at: userRow.created_at as string
    };

    // Contar los animes del usuario
    const animeCountResult = await client.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM user_animes
        WHERE user_id = ?
      `,
      args: [user.id]
    });

    const animeCount = animeCountResult.rows[0]?.count as number || 0;

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