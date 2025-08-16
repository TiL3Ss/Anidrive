// app/api/user/animes/add/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const STATES_VIEW_OPTIONS = [
  { id: 1, name: 'Viendo' }, { id: 2, name: 'Terminado' },
  { id: 3, name: 'Pendiente' }, { id: 4, name: 'Abandonado' }
];

const RATINGS_OPTIONS = [
  { id: 1, value: '1★' }, { id: 2, value: '2★' },
  { id: 3, value: '3★' }, { id: 4, value: '4★' }, { id: 5, value: '5★' }
];

const SEASONS_OPTIONS = [
  { id: 1, name: 'Invierno' }, { id: 2, name: 'Primavera' },
  { id: 3, name: 'Verano' }, { id: 4, name: 'Otoño' }
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const {
    animeName,
    seasonCour,
    year,
    totalChapters,
    currentChapter,
    stateId,
    rateId,
    seasonId,
    review,
  } = await request.json();

  if (!animeName || !year || !seasonCour || !stateId || !seasonId) {
    return NextResponse.json({
      message: 'Campos requeridos faltantes: nombre, año, temporada/cour, estado, temporada de estreno.'
    }, { status: 400 });
  }

  try {
    const client = getTursoClient();

    const stateName = STATES_VIEW_OPTIONS.find(s => s.id === stateId)?.name || null;
    const ratingValue = RATINGS_OPTIONS.find(r => r.id === rateId)?.value || null;
    const seasonName = SEASONS_OPTIONS.find(s => s.id === seasonId)?.name || null;

    if (!stateName || !seasonName) {
      return NextResponse.json({
        message: 'Valores de estado o temporada inválidos.'
      }, { status: 400 });
    }

    // 1. Buscar el anime en MyAnimeList
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5454';
    const searchResponse = await fetch(
      `${baseUrl}/api/user/animes/search-mal?name=${encodeURIComponent(animeName)}&season=${seasonCour}&season_name=${seasonName}&year=${year}`
    );

    if (!searchResponse.ok) {
      return NextResponse.json({
        message: 'Error al buscar el anime en MyAnimeList',
        details: await searchResponse.text()
      }, { status: 500 });
    }

    const searchData = await searchResponse.json();

    if (!searchData.success || !searchData.mal_id) {
      return NextResponse.json({
        message: 'No se encontró el anime en MyAnimeList',
        details: searchData
      }, { status: 404 });
    }
    
    const malTitle = searchData.title;
    const imageUrl = searchData.image_url;

    // 3. Guardar en la base de datos (parte de animes)
    const animeResult = await client.execute({
      sql: 'SELECT id, image_url FROM animes WHERE LOWER(name) = ? AND LOWER(season) = ? AND year = ?',
      args: [animeName.toLowerCase(), seasonCour.toLowerCase(), year]
    });

    let animeId;

    if (animeResult.rows.length === 0) {
      // Insertar nuevo anime con todos los datos
      const insertResult = await client.execute({
        sql: `INSERT INTO animes (name, name_mal, season, total_chapters, year, season_name, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [animeName, malTitle, seasonCour, totalChapters, year, seasonName, imageUrl]
      });
      animeId = insertResult.lastInsertRowid;
    } else {
      // Actualizar anime existente
      const anime = animeResult.rows[0];
      animeId = anime.id;
      // Solo actualizar image_url si no existe o si tenemos una nueva
      const finalImageUrl = anime.image_url || imageUrl;
      await client.execute({
        sql: `UPDATE animes 
              SET name_mal = ?, image_url = ?
              WHERE id = ?`,
        args: [malTitle, finalImageUrl, animeId]
      });
    }

    // 4. Verificar si el usuario ya tiene este anime
    const userAnimeExistsResult = await client.execute({
      sql: 'SELECT id FROM user_animes WHERE user_id = ? AND anime_id = ?',
      args: [userId, animeId]
    });

    if (userAnimeExistsResult.rows.length > 0) {
      return NextResponse.json({
        message: 'Este anime ya ha sido añadido a tu Drive.'
      }, { status: 409 });
    }

    // 5. Insertar relación usuario-anime, incluyendo la reseña
    await client.execute({
      sql: `INSERT INTO user_animes (user_id, anime_id, current_chapter, state_name, rating_value, review)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, animeId, currentChapter, stateName, ratingValue, review]
    });

    return NextResponse.json({
      message: 'Anime añadido con éxito',
      animeId: animeId,
      malData: {
        mal_id: searchData.mal_id,
        title: malTitle,
        image_url: imageUrl
      }
    });

  } catch (error: any) {
    console.error('Error adding anime for user:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        message: 'Error de base de datos: Posible duplicado de anime o asociación de usuario.'
      }, { status: 409 });
    }
    return NextResponse.json({
      message: 'Error interno del servidor al añadir anime.'
    }, { status: 500 });
  }
}