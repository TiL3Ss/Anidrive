// app/api/user/animes/recommend/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  // CAMBIO PRINCIPAL: Determinar qué userId usar
  let targetUserId: string;
  
  if (userIdParam) {
    // Si se proporciona userId en los parámetros, usarlo
    targetUserId = userIdParam;
    console.log('GET /api/user/animes/recommend: Usando userId de parámetros:', targetUserId);
    
    // Verificar que el userId proporcionado existe (opcional, para seguridad)
    const db = await getDb();
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (!userExists) {
      console.warn('GET /api/user/animes/recommend: Usuario no encontrado:', targetUserId);
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
  } else {
    // Si no se proporciona userId, usar el de la sesión (comportamiento original)
    targetUserId = session.user.id;
    console.log('GET /api/user/animes/recommend: Usando userId de sesión:', targetUserId);
  }

  try {
    const db = await getDb();

    console.log('GET /api/user/animes/recommend: Buscando recomendaciones para userId:', targetUserId);

    const recommendedAnimes = await db.all(
      `SELECT
         a.id,
         a.name as title,
         a.image_url as imageUrl,
         a.season as seasonCour,
         a.year,
         a.total_chapters as totalChapters,
         ua.current_chapter as currentEpisode,
         ua.state_name as state,
         ua.rating_value as rating,
         ua.recommended,
         a.season_name as season
       FROM animes a
       JOIN user_animes ua ON a.id = ua.anime_id
       WHERE ua.user_id = ? AND ua.recommended = true
       ORDER BY a.name ASC`,
      [targetUserId]
    );

    console.log('GET /api/user/animes/recommend: Recomendaciones encontradas:', recommendedAnimes.length, 'para usuario:', targetUserId);

    return NextResponse.json(recommendedAnimes);

  } catch (error: any) {
    console.error('GET /api/user/animes/recommend: Error obteniendo animes recomendados:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  // IMPORTANTE: El PUT solo debe funcionar para el propio usuario (seguridad)
  const userId = session.user.id;
  const { animeId, recommended } = await request.json();

  if (!animeId || typeof recommended !== 'boolean') {
    return NextResponse.json(
      { message: 'Se requieren animeId y recommended (booleano)' },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();

    const existingRecord = await db.get(
      'SELECT id FROM user_animes WHERE user_id = ? AND anime_id = ?',
      [userId, animeId]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { message: 'No se encontró el anime en tu lista' },
        { status: 404 }
      );
    }

    console.log('PUT /api/user/animes/recommend: Actualizando recomendación para anime:', animeId, 'usuario:', userId, 'recomendado:', recommended);

    const result = await db.run(
      `UPDATE user_animes
         SET recommended = ?
         WHERE user_id = ? AND anime_id = ?`,
      [recommended, userId, animeId]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { message: 'No se realizaron cambios' },
        { status: 200 }
      );
    }

    console.log('PUT /api/user/animes/recommend: Recomendación actualizada exitosamente');

    return NextResponse.json({
      success: true,
      message: `Anime ${recommended ? 'marcado como recomendado' : 'quitado de recomendados'}`
    });

  } catch (error: any) {
    console.error('PUT /api/user/animes/recommend: Error actualizando estado recommended:', error);
    return NextResponse.json(
      {
        message: 'Error interno del servidor',
        detail: error.message
      },
      { status: 500 }
    );
  }
}