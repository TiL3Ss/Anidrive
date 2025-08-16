// app/api/user/animes/search-mal/route.ts
import { chromium } from 'playwright'
import { NextResponse } from 'next/server'

// Mapeo de nombres de temporada en español a inglés
const SEASON_TRANSLATIONS: Record<string, string> = {
  'invierno': 'winter',
  'primavera': 'spring',
  'verano': 'summer',
  'otoño': 'fall',
  'otoÃ±o': 'fall' 
}

// Cache para imágenes (opcional, para mejorar rendimiento)
const imageCache = new Map()
const CACHE_TIMEOUT = 600000 // 10 minutos

async function extractAnimeImage(page: any, animeUrl: string): Promise<string | null> {
  try {
    // Ir a la página específica del anime para obtener la imagen
    await page.goto(animeUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 8000
    })

    // Extraer la imagen usando los mismos selectores del código original
    const image_url = await page.evaluate(() => {
      const imgElement = document.querySelector('img[itemprop="image"]') as HTMLImageElement || 
                        document.querySelector('.leftside img[src*="myanimelist.net/images/anime"]') as HTMLImageElement
      
      // Probar diferentes atributos de la imagen
      const imageSrc = imgElement?.src || 
                      imgElement?.getAttribute('data-src') || 
                      null

      return imageSrc
    })

    // Validar y formatear URL de imagen
    if (image_url && image_url.includes('myanimelist.net')) {
      return image_url
    }
    
    return null
  } catch (error) {
    console.error('Error extrayendo imagen:', error)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Normalizar parámetros
  const name = searchParams.get('name')?.toLowerCase() || ''
  const season = searchParams.get('season')?.replace(/\D/g, '') || '1' // Extraer solo números
  let season_name = searchParams.get('season_name')?.toLowerCase() || ''
  const year = searchParams.get('year') || ''

  // Traducir season_name si está en español
  if (season_name && SEASON_TRANSLATIONS[season_name]) {
    season_name = SEASON_TRANSLATIONS[season_name]
  }

  if (!name) {
    return NextResponse.json(
      { error: 'El parámetro "name" es requerido' },
      { status: 400 }
    )
  }

  let browser
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox']
    })
    const context = await browser.newContext()
    const page = await context.newPage()

    // Estrategia 1: Búsqueda directa (siempre primero)
    await page.goto(`https://myanimelist.net/anime.php?q=${encodeURIComponent(name)}&cat=anime`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    })

    const animeFromSearch = await page.evaluate((searchName) => {
      const results = Array.from(document.querySelectorAll('.list-table .title'))
      for (const item of results) {
        const title = item.textContent?.toLowerCase()
        const link = item.getAttribute('href')
        if (title?.includes(searchName) && link) {
          const idMatch = link.match(/anime\/(\d+)/)
          if (idMatch) {
            // Construir URL completa si es necesario
            const fullUrl = link.startsWith('http') ? link : `https://myanimelist.net${link}`
            return {
              id: idMatch[1],
              title: item.textContent?.trim(),
              url: fullUrl
            }
          }
        }
      }
      return null
    }, name)

    if (animeFromSearch) {
      // Verificar caché de imagen
      let image_url = imageCache.get(animeFromSearch.id)
      
      if (!image_url) {
        // Extraer imagen de la página del anime
        image_url = await extractAnimeImage(page, animeFromSearch.url)
        
        // Guardar en caché si se obtuvo la imagen
        if (image_url) {
          imageCache.set(animeFromSearch.id, image_url)
          setTimeout(() => imageCache.delete(animeFromSearch.id), CACHE_TIMEOUT)
        }
      }

      return NextResponse.json({
        success: true,
        mal_id: animeFromSearch.id,
        title: animeFromSearch.title,
        url: animeFromSearch.url,
        image_url: image_url || 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg', // Imagen por defecto
        search_method: 'direct_search'
      })
    }

    // Estrategia 2: Búsqueda por temporada (si tenemos los datos)
    if (season_name && year) {
      await page.goto(`https://myanimelist.net/anime/season/${year}/${season_name}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      const animeFromSeason = await page.evaluate((searchName) => {
        const items = Array.from(document.querySelectorAll('.seasonal-anime'))
        for (const item of items) {
          const titleEl = item.querySelector('.title a') || item.querySelector('a.link-title')
          const title = titleEl?.textContent?.toLowerCase()
          const link = titleEl?.getAttribute('href')
          if (title?.includes(searchName) && link) {
            const idMatch = link.match(/anime\/(\d+)/)
            if (idMatch) {
              // Construir URL completa si es necesario
              const fullUrl = link.startsWith('http') ? link : `https://myanimelist.net${link}`
              return {
                id: idMatch[1],
                title: titleEl.textContent?.trim(),
                url: fullUrl
              }
            }
          }
        }
        return null
      }, name)

      if (animeFromSeason) {
        // Verificar caché de imagen
        let image_url = imageCache.get(animeFromSeason.id)
        
        if (!image_url) {
          // Extraer imagen de la página del anime
          image_url = await extractAnimeImage(page, animeFromSeason.url)
          
          // Guardar en caché si se obtuvo la imagen
          if (image_url) {
            imageCache.set(animeFromSeason.id, image_url)
            setTimeout(() => imageCache.delete(animeFromSeason.id), CACHE_TIMEOUT)
          }
        }

        return NextResponse.json({
          success: true,
          mal_id: animeFromSeason.id,
          title: animeFromSeason.title,
          url: animeFromSeason.url,
          image_url: image_url || 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg', // Imagen por defecto
          search_method: 'season_search'
        })
      }
    }

    // Si todo falla
    return NextResponse.json(
      {
        error: 'Anime no encontrado',
        suggestions: [
          'Verifica la ortografía del nombre',
          'Intenta con el nombre en inglés/japonés',
          'Prueba sin acentos o caracteres especiales',
          season_name && year ? '' : 'Proporciona temporada y año para búsqueda más precisa'
        ].filter(Boolean),
        attempted_params: {
          normalized_name: name,
          normalized_season: season,
          normalized_season_name: season_name,
          year
        }
      },
      { status: 404 }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en la búsqueda:', errorMessage)
    
    return NextResponse.json(
      { 
        error: 'Error en la búsqueda',
        details: errorMessage
      },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close().catch(console.error)
  }
}