// app/api/user/[username]/animes/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

interface UserAnimeRow {
  id: number;
  name: string;
  name_mal: string | null;
  season: string;
  total_chapters: number | null;
  current_chapter: number | null;
  state_name: string | null;
  rating_value: string | null;
  year: number;
  season_name: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log('GET /api/user/[username]/animes: Solicitud recibida para usuario:', params.username);

    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.warn('GET /api/user/[username]/animes: No autenticado.');
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { username } = params;
    const { searchParams } = new URL(request.url);
    const stateFilter = searchParams.get('state');

    if (!username) {
      return NextResponse.json(
        { error: 'Username requerido' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos SQLite
    const db = await getDb();

    // Primero, obtener el ID del usuario
    const userQuery = `
      SELECT id
      FROM users 
      WHERE LOWER(username) = LOWER(?)
      LIMIT 1
    `;

    const user = await db.get<{ id: number }>(userQuery, [username]);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener los animes del usuario
    let query = `
      SELECT
        a.id,
        a.name,
        a.name_mal,
        a.season,
        a.total_chapters,
        ua.current_chapter,
        ua.state_name,
        ua.rating_value,
        a.year,
        a.season_name,
        a.image_url,
        a.created_at,
        a.updated_at,
        ua.user_id
      FROM
        animes a
      JOIN
        user_animes ua ON a.id = ua.anime_id
      WHERE
        ua.user_id = ?
    `;

    const params_array: (string | number | null)[] = [user.id];

    // Aplicar filtro de estado si se proporciona
    if (stateFilter) {
      query += ' AND ua.state_name = ?';
      params_array.push(stateFilter);
    }

    query += ' ORDER BY a.year DESC, a.name ASC';

    const animes = await db.all<UserAnimeRow[]>(query, params_array);

    console.log('Animes encontrados para usuario', username, ':', animes.length);

    return NextResponse.json(animes);

  } catch (error: any) {
    console.error('GET /api/user/[username]/animes: Error CRÍTICO:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { message: 'Error interno del servidor al obtener animes del usuario.', detail: error.message },
      { status: 500 }
    );
  }
}