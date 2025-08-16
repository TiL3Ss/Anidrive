// app/api/user/[username]/animes/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
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

    // Conectar a la base de datos Turso
    const client = getTursoClient();

    // Primero, obtener el ID del usuario
    const userResult = await client.execute({
      sql: `SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1`,
      args: [username]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Obtener los animes del usuario
    let sql = `
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

    const args: (string | number | null)[] = [user.id as number];

    // Aplicar filtro de estado si se proporciona
    if (stateFilter) {
      sql += ' AND ua.state_name = ?';
      args.push(stateFilter);
    }

    sql += ' ORDER BY a.year DESC, a.name ASC';

    const animesResult = await client.execute({
      sql: sql,
      args: args
    });

    // Convertir las filas al formato esperado
    const animes: UserAnimeRow[] = animesResult.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      name_mal: row.name_mal as string | null,
      season: row.season as string,
      total_chapters: row.total_chapters as number | null,
      current_chapter: row.current_chapter as number | null,
      state_name: row.state_name as string | null,
      rating_value: row.rating_value as string | null,
      year: row.year as number,
      season_name: row.season_name as string | null,
      image_url: row.image_url as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      user_id: row.user_id as number
    }));

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