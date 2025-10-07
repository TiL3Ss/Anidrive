// app/api/user/animes/add/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { searchMALAnime } from '../../../../lib/malSearchService';

// Helper para convertir BigInt a Number de forma segura
function bigIntToNumber(value: any): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

const STATES_VIEW_OPTIONS = [
  { id: 1, name: 'Viendo' }, 
  { id: 2, name: 'Terminado' },
  { id: 3, name: 'Pendiente' }, 
  { id: 4, name: 'Abandonado' }
];

const RATINGS_OPTIONS = [
  { id: 1, value: '1★' }, 
  { id: 2, value: '2★' },
  { id: 3, value: '3★' }, 
  { id: 4, value: '4★' }, 
  { id: 5, value: '5★' }
];

const SEASONS_OPTIONS = [
  { id: 1, name: 'Invierno' }, 
  { id: 2, name: 'Primavera' },
  { id: 3, name: 'Verano' }, 
  { id: 4, name: 'Otoño' }
];

// Función helper para obtener la URL base correcta
function getBaseUrl(req: Request): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
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

    const stateName = STATES_VIEW_OPTIONS.find(s => s.id === stateId)?.name || null;
    const ratingValue = RATINGS_OPTIONS.find(r => r.id === rateId)?.value || null;
    const seasonName = SEASONS_OPTIONS.find(s => s.id === seasonId)?.name || null;

    if (!stateName || !seasonName) {
      return NextResponse.json({
        message: 'Valores de estado o temporada inválidos.'
      }, { status: 400 });
    }

    // 1. Buscar el anime en MyAnimeList - AHORA SIN FETCH
    console.log('🔍 Buscando anime en MAL:', animeName);
    
    let malId = null;
    let malTitle = animeName;
    let malTitleEnglish = null;
    let malTitleJapanese = null;
    let imageUrl = 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg';
    let synopsis = null;
    let searchMethod = null;

    try {
      // ✅ Llamada directa a la función compartida (sin HTTP)
      const searchData = await searchMALAnime({
        name: animeName,
        season: seasonCour,
        seasonName: seasonName,
        year: year
      });

      console.log('📦 Resultado de búsqueda MAL:', searchData);

      if (searchData.success && searchData.mal_id) {
        console.log('✅ DATOS MAL ENCONTRADOS');
        
        malId = searchData.mal_id;
        malTitle = searchData.title || animeName;
        malTitleEnglish = searchData.title_english || null;
        malTitleJapanese = searchData.title_japanese || null;
        
        if (searchData.image_url && searchData.image_url.trim() !== '') {
          imageUrl = searchData.image_url;
          console.log('✅ Image URL asignada:', imageUrl);
        }
        
        synopsis = searchData.synopsis || null;
        searchMethod = searchData.search_method || null;

        console.log('📝 Valores MAL asignados:', {
          malId,
          malTitle,
          imageUrl,
          searchMethod
        });
      } else {
        console.warn('⚠️ No se encontró en MAL:', searchData.error);
      }
    } catch (fetchError: any) {
      console.error('⚠️ Error buscando en MAL:', fetchError.message);
    }

    // 2. Verificar si el anime ya existe
    const animeResult = await client.execute({
      sql: 'SELECT id, image_url, name_mal, mal_id FROM animes WHERE LOWER(name) = ? AND LOWER(season) = ? AND year = ?',
      args: [animeName.toLowerCase(), seasonCour.toLowerCase(), year]
    });

    let animeId;
    let isNewAnime = false;

    if (animeResult.rows.length === 0) {
      console.log('📝 Insertando nuevo anime con valores:', {
        name: animeName,
        mal_id: malId,
        name_mal: malTitle,
        image_url: imageUrl
      });

      const insertResult = await client.execute({
        sql: `INSERT INTO animes (
          name, 
          name_mal, 
          name_mal_english, 
          name_mal_japanese, 
          mal_id, 
          season, 
          total_chapters, 
          year, 
          season_name, 
          image_url,
          synopsis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          animeName,
          malTitle,
          malTitleEnglish,
          malTitleJapanese,
          malId,
          seasonCour,
          totalChapters || 0,
          year,
          seasonName,
          imageUrl,
          synopsis
        ]
      });
      
      animeId = bigIntToNumber(insertResult.lastInsertRowid);
      isNewAnime = true;
      console.log('✅ Nuevo anime insertado con ID:', animeId);
    } else {
      const anime = animeResult.rows[0];
      animeId = bigIntToNumber(anime.id);
      
      const shouldUpdateMal = malId && (
        !anime.mal_id || 
        !anime.name_mal || 
        !anime.image_url ||
        anime.image_url === 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg'
      );
      
      if (shouldUpdateMal) {
        console.log('🔄 Actualizando anime existente con datos MAL');
        
        await client.execute({
          sql: `UPDATE animes 
                SET mal_id = COALESCE(mal_id, ?),
                    name_mal = COALESCE(name_mal, ?),
                    name_mal_english = COALESCE(name_mal_english, ?),
                    name_mal_japanese = COALESCE(name_mal_japanese, ?),
                    image_url = CASE 
                      WHEN image_url = 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg' 
                      THEN ? 
                      ELSE COALESCE(image_url, ?) 
                    END,
                    synopsis = COALESCE(synopsis, ?)
                WHERE id = ?`,
          args: [
            malId,
            malTitle,
            malTitleEnglish,
            malTitleJapanese,
            imageUrl,
            imageUrl,
            synopsis,
            animeId
          ]
        });
        console.log('✅ Anime actualizado');
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
      sql: `INSERT INTO user_animes (
        user_id, 
        anime_id, 
        current_chapter, 
        state_name, 
        rating_value, 
        review
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        animeId,
        currentChapter || 0,
        stateName,
        ratingValue,
        review || null
      ]
    });

    console.log('✅ Relación usuario-anime creada');

    const responseData: any = {
      message: 'Anime añadido con éxito',
      animeId: animeId,
      isNewAnime: isNewAnime,
    };

    if (malId) {
      responseData.malData = {
        mal_id: malId,
        title: malTitle,
        title_english: malTitleEnglish,
        title_japanese: malTitleJapanese,
        url: `https://myanimelist.net/anime/${malId}`,
        image_url: imageUrl,
        synopsis: synopsis,
        search_method: searchMethod,
        source: 'jikan_api'
      };
    } else {
      responseData.malData = {
        message: 'No se encontraron datos en MyAnimeList',
        using_defaults: true,
        default_image: imageUrl
      };
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ Error adding anime:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        message: 'Error de base de datos: Posible duplicado.'
      }, { status: 409 });
    }

    if (error.message && error.message.includes('no such column')) {
      return NextResponse.json({
        message: 'Error de base de datos: Falta una columna.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}