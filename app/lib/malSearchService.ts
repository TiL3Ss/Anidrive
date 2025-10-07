// lib/malSearchService.ts
// Servicio compartido para búsqueda en MyAnimeList

const SEASON_TRANSLATIONS: Record<string, string> = {
  'invierno': 'winter',
  'primavera': 'spring',
  'verano': 'summer',
  'otoño': 'fall',
  'otoÃ±o': 'fall'
}

const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TIMEOUT = 600000 // 10 minutos

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 350 // 350ms entre requests

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
    const response = await rateLimitedFetch(
      `https://api.jikan.moe/v4/seasons/${year}/${season}`
    )

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`)
    }

    const data = await response.json()
    
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

  const normalizedSearch = searchName.toLowerCase().trim()

  let bestMatch = results.find((anime: any) => 
    anime.title?.toLowerCase() === normalizedSearch ||
    anime.title_english?.toLowerCase() === normalizedSearch ||
    anime.title_japanese?.toLowerCase() === normalizedSearch
  )

  if (!bestMatch) {
    bestMatch = results.find((anime: any) =>
      anime.title?.toLowerCase().includes(normalizedSearch) ||
      anime.title_english?.toLowerCase().includes(normalizedSearch) ||
      anime.title_japanese?.toLowerCase().includes(normalizedSearch)
    )
  }

  if (!bestMatch && results.length > 0) {
    bestMatch = results[0]
  }

  return bestMatch
}

export interface MALSearchParams {
  name: string
  season?: string
  seasonName?: string
  year?: string
}

export interface MALSearchResult {
  success: boolean
  mal_id?: string
  title?: string
  title_english?: string
  title_japanese?: string
  url?: string
  image_url?: string
  synopsis?: string
  search_method?: string
  error?: string
}

export async function searchMALAnime(params: MALSearchParams): Promise<MALSearchResult> {
  const { name, seasonName, year } = params
  
  if (!name) {
    return { 
      success: false,
      error: 'El parámetro "name" es requerido' 
    }
  }

  try {
    let searchResult = null
    let searchMethod = ''

    // Traducir temporada si es necesario
    let translatedSeason = seasonName?.toLowerCase() || ''
    if (translatedSeason && SEASON_TRANSLATIONS[translatedSeason]) {
      translatedSeason = SEASON_TRANSLATIONS[translatedSeason]
    }

    // Estrategia 1: Búsqueda por temporada
    if (translatedSeason && year && ['winter', 'spring', 'summer', 'fall'].includes(translatedSeason)) {
      const seasonData = await searchAnimeBySeasonYear(year, translatedSeason, name)
      
      if (seasonData?.data && seasonData.data.length > 0) {
        searchResult = findBestMatch(seasonData.data, name)
        searchMethod = 'season_search'
      }
    }

    // Estrategia 2: Búsqueda directa por nombre
    if (!searchResult) {
      const searchData = await searchAnimeByName(name)
      
      if (searchData?.data && searchData.data.length > 0) {
        searchResult = findBestMatch(searchData.data, name)
        searchMethod = 'direct_search'
      }
    }

    // Si encontramos resultado
    if (searchResult) {
      return {
        success: true,
        mal_id: searchResult.mal_id?.toString(),
        title: searchResult.title,
        title_english: searchResult.title_english,
        title_japanese: searchResult.title_japanese,
        url: searchResult.url,
        image_url: searchResult.images?.jpg?.large_image_url || 
                   searchResult.images?.jpg?.image_url || 
                   'https://cdn.myanimelist.net/images/anime/1141/142503.jpg',
        synopsis: searchResult.synopsis,
        search_method: searchMethod,
      }
    }

    return {
      success: false,
      error: 'Anime no encontrado'
    }
  } catch (error: any) {
    console.error('Error en la búsqueda MAL:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido'
    }
  }
}