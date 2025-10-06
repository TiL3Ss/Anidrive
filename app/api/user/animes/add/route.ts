// app/api/user/animes/add/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Helper para convertir BigInt a Number de forma segura
function bigIntToNumber(value: any): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

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

// Función helper para obtener la URL base correcta
function getBaseUrl(req: Request): string {
  // En producción, usar el host de la request
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Si hay variable de entorno configurada
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Obtener del header de la request
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Fallback para desarrollo local
  return 'http://localhost:5454';
}

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

  // Validación de campos requeridos
  if (!animeName || !year || !seasonCour || !stateId || !seasonId) {
    return NextResponse.json({
      message: 'Campos requeridos faltantes: nombre, año, temporada/cour, estado, temporada de estreno.'
    }, { status: 400 });
  }

  try {
    const client = getTursoClient();

    // Obtener nombres de estado, rating y temporada
    const stateName = STATES_VIEW_OPTIONS.find(s => s.id === stateId)?.name || null;
    const ratingValue = RATINGS_OPTIONS.find(r => r.id === rateId)?.value || null;
    const seasonName = SEASONS_OPTIONS.find(s => s.id === seasonId)?.name || null;

    if (!stateName || !seasonName) {
      return NextResponse.json({
        message: 'Valores de estado o temporada inválidos.'
      }, { status: 400 });
    }

    // 1. Buscar el anime en MyAnimeList usando la URL correcta
    const baseUrl = getBaseUrl(request);
    const searchUrl = `${baseUrl}/api/user/animes/search-mal?name=${encodeURIComponent(animeName)}&season=${seasonCour}&season_name=${seasonName}&year=${year}`;
    
    console.log('Base URL:', baseUrl);
    console.log('Buscando anime en MAL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Aumentar timeout para Vercel
      signal: AbortSignal.timeout(25000), // 25 segundos
    });

    let malData = null;
    let malId = null;
    let malTitle = animeName; // Fallback al nombre original
    let imageUrl = 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg'; // Imagen por defecto

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Respuesta de MAL:', searchData);

      // Verificar si la búsqueda fue exitosa
      if (searchData.success && searchData.mal_id) {
        malId = searchData.mal_id;
        malTitle = searchData.title || animeName;
        imageUrl = searchData.image_url || imageUrl;
        malData = {
          mal_id: malId,
          title: malTitle,
          url: searchData.url,
          image_url: imageUrl,
          search_method: searchData.search_method
        };
      } else {
        console.warn('No se encontró el anime en MAL, usando valores por defecto');
      }
    } else {
      const errorText = await searchResponse.text();
      console.warn('Error en la búsqueda de MAL:', errorText);
    }

    // 2. Verificar si el anime ya existe en la base de datos
    const animeResult = await client.execute({
      sql: 'SELECT id, image_url, name_mal FROM animes WHERE LOWER(name) = ? AND LOWER(season) = ? AND year = ?',
      args: [animeName.toLowerCase(), seasonCour.toLowerCase(), year]
    });

    let animeId;

    if (animeResult.rows.length === 0) {
      // Insertar nuevo anime con todos los datos (SIN mal_id)
      const insertResult = await client.execute({
        sql: `INSERT INTO animes (name, name_mal, season, total_chapters, year, season_name, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          animeName,
          malTitle,
          seasonCour,
          totalChapters || 0,
          year,
          seasonName,
          imageUrl
        ]
      });
      animeId = insertResult.lastInsertRowid;
      animeId = bigIntToNumber(animeId); // Convertir BigInt a Number
      console.log('Nuevo anime insertado con ID:', animeId);
    } else {
      // Anime existente
      const anime = animeResult.rows[0];
      animeId = bigIntToNumber(anime.id); // Convertir BigInt a Number
      
      // Actualizar datos de MAL si los encontramos y no existían antes
      const shouldUpdateMal = malTitle && imageUrl && (!anime.name_mal || !anime.image_url);
      
      if (shouldUpdateMal) {
        await client.execute({
          sql: `UPDATE animes 
                SET name_mal = COALESCE(name_mal, ?), 
                    image_url = COALESCE(image_url, ?)
                WHERE id = ?`,
          args: [malTitle, imageUrl, animeId]
        });
        console.log('Anime actualizado con datos de MAL');
      }
    }

    // 3. Verificar si el usuario ya tiene este anime
    const userAnimeExistsResult = await client.execute({
      sql: 'SELECT id FROM user_animes WHERE user_id = ? AND anime_id = ?',
      args: [userId, animeId]
    });

    if (userAnimeExistsResult.rows.length > 0) {
      return NextResponse.json({
        message: 'Este anime ya ha sido añadido a tu Drive.'
      }, { status: 409 });
    }

    // 4. Insertar relación usuario-anime
    await client.execute({
      sql: `INSERT INTO user_animes (user_id, anime_id, current_chapter, state_name, rating_value, review)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        animeId,
        currentChapter || 0,
        stateName,
        ratingValue,
        review || null
      ]
    });

    console.log('Relación usuario-anime creada exitosamente');

    return NextResponse.json({
      message: 'Anime añadido con éxito',
      animeId: animeId,
      malData: malData || {
        message: 'No se encontraron datos en MyAnimeList',
        using_defaults: true
      }
    });

  } catch (error: any) {
    console.error('Error adding anime for user:', error);
    
    // Manejo específico de errores de base de datos
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        message: 'Error de base de datos: Posible duplicado de anime o asociación de usuario.'
      }, { status: 409 });
    }

    // Error de conexión
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        message: 'Error de configuración: No se puede conectar a la API de búsqueda.',
        hint: 'Verifica la configuración de NEXT_PUBLIC_API_URL en las variables de entorno.'
      }, { status: 500 });
    }

    // Error genérico
    return NextResponse.json({
      message: 'Error interno del servidor al añadir anime.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}