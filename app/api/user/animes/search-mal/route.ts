// app/api/user/animes/search-mal/route.ts
import { NextResponse } from 'next/server'

// Mapeo de nombres de temporada en español a inglés
const SEASON_TRANSLATIONS: Record<string, string> = {
  'invierno': 'winter',
  'primavera': 'spring',
  'verano': 'summer',
  'otoño': 'fall',
  'otoño': 'fall'
}

// Cache simple para reducir llamadas a la API
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TIMEOUT = 600000 // 10 minutos

// Rate limiting para Jikan API (respetar límites de 3 req/seg y 60 req/min)
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 350 // 350ms entre requests para estar seguros

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }
  
  lastRequestTime = Date.now()
  return fetch(url)
}

async function searchAnimeByName(name: string) {
  const cacheKey = `search:${name}`
  const cached = apiCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data
  }

  try {
    const response = await rateLimitedFetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(name)}&limit=10&order_by=popularity`
    )

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`)
    }

    const data = await response.json()
    apiCache.set(cacheKey, { data, timestamp: Date.now() })
    
    return data
  } catch (error) {
    console.error('Error en búsqueda por nombre:', error)
    return null
  }
}

async function searchAnimeBySeasonYear(year: string, season: string, name: string) {
  const cacheKey = `season:${year}:${season}:${name}`
  const cached = apiCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data
  }

  try {
    // Primero obtenemos todos los animes de la temporada
    const response = await rateLimitedFetch(
      `https://api.jikan.moe/v4/seasons/${year}/${season}`
    )

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filtramos localmente por el nombre
    const filtered = {
      data: data.data?.filter((anime: any) => 
        anime.title?.toLowerCase().includes(name.toLowerCase()) ||
        anime.title_english?.toLowerCase().includes(name.toLowerCase()) ||
        anime.title_japanese?.toLowerCase().includes(name.toLowerCase())
      ) || []
    }
    
    apiCache.set(cacheKey, { data: filtered, timestamp: Date.now() })
    return filtered
  } catch (error) {
    console.error('Error en búsqueda por temporada:', error)
    return null
  }
}

function findBestMatch(results: any[], searchName: string) {
  if (!results || results.length === 0) return null

  // Normalizar el nombre de búsqueda
  const normalizedSearch = searchName.toLowerCase().trim()

  // Buscar coincidencia exacta primero
  let bestMatch = results.find((anime: any) => 
    anime.title?.toLowerCase() === normalizedSearch ||
    anime.title_english?.toLowerCase() === normalizedSearch ||
    anime.title_japanese?.toLowerCase() === normalizedSearch
  )

  // Si no hay coincidencia exacta, buscar la que contenga el nombre
  if (!bestMatch) {
    bestMatch = results.find((anime: any) =>
      anime.title?.toLowerCase().includes(normalizedSearch) ||
      anime.title_english?.toLowerCase().includes(normalizedSearch) ||
      anime.title_japanese?.toLowerCase().includes(normalizedSearch)
    )
  }

  // Si aún no hay match, tomar el más popular
  if (!bestMatch && results.length > 0) {
    bestMatch = results[0]
  }

  return bestMatch
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const name = searchParams.get('name')?.toLowerCase() || ''
  const season = searchParams.get('season')?.replace(/\D/g, '') || '1'
  let season_name = searchParams.get('season_name')?.toLowerCase() || ''
  const year = searchParams.get('year') || ''

  // Traducir temporada si es necesario
  if (season_name && SEASON_TRANSLATIONS[season_name]) {
    season_name = SEASON_TRANSLATIONS[season_name]
  }

  if (!name) {
    return NextResponse.json({ 
      error: 'El parámetro "name" es requerido' 
    }, { status: 400 })
  }

  try {
    let searchResult = null
    let searchMethod = ''

    // Estrategia 1: Si tenemos temporada y año, buscar por temporada primero
    if (season_name && year && ['winter', 'spring', 'summer', 'fall'].includes(season_name)) {
      const seasonData = await searchAnimeBySeasonYear(year, season_name, name)
      
      if (seasonData?.data && seasonData.data.length > 0) {
        searchResult = findBestMatch(seasonData.data, name)
        searchMethod = 'season_search'
      }
    }

    // Estrategia 2: Búsqueda directa por nombre si no encontramos por temporada
    if (!searchResult) {
      const searchData = await searchAnimeByName(name)
      
      if (searchData?.data && searchData.data.length > 0) {
        searchResult = findBestMatch(searchData.data, name)
        searchMethod = 'direct_search'
      }
    }

    // Si encontramos resultado
    if (searchResult) {
      return NextResponse.json({
        success: true,
        mal_id: searchResult.mal_id?.toString(),
        title: searchResult.title || searchResult.title_english,
        title_english: searchResult.title_english,
        title_japanese: searchResult.title_japanese,
        url: searchResult.url,
        image_url: searchResult.images?.jpg?.large_image_url || 
                   searchResult.images?.jpg?.image_url || 
                   'https://cdn.myanimelist.net/images/anime/1141/142503.jpg',
        synopsis: searchResult.synopsis,
        episodes: searchResult.episodes,
        score: searchResult.score,
        year: searchResult.year,
        season: searchResult.season,
        status: searchResult.status,
        search_method: searchMethod,
      })
    }

    // Si no se encontró nada
    return NextResponse.json(
      {
        error: 'Anime no encontrado',
        suggestions: [
          'Verifica la ortografía del nombre',
          'Intenta con el nombre en inglés o japonés',
          'Prueba sin acentos o caracteres especiales',
          season_name && year ? '' : 'Proporciona temporada y año para búsqueda más precisa',
        ].filter(Boolean),
        attempted_params: {
          normalized_name: name,
          normalized_season: season,
          normalized_season_name: season_name,
          year,
        },
      },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error en la búsqueda:', error)
    return NextResponse.json(
      {
        error: 'Error en la búsqueda',
        details: error.message || 'Error desconocido',
        hint: 'Verifica que la API de Jikan esté disponible'
      },
      { status: 500 }
    )
  }
}