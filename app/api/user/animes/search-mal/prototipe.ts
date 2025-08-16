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
    browser = await chromium.launch({ headless: true })
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
            return {
              id: idMatch[1],
              title: item.textContent?.trim(),
              url: link
            }
          }
        }
      }
      return null
    }, name)

    if (animeFromSearch) {
      // Obtener información detallada del anime encontrado para mejorar la búsqueda
      await page.goto(`https://myanimelist.net${animeFromSearch.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      const improvedTitle = await page.evaluate((searchName) => {
        // Buscar títulos en el div principal
        const titleDiv = document.querySelector('div[itemprop="name"]')
        const mainTitle = titleDiv?.querySelector('h1.title-name strong')?.textContent?.trim()
        const englishTitle = titleDiv?.querySelector('p.title-english')?.textContent?.trim()
        
        // Verificar si alguno de los títulos coincide mejor con la búsqueda
        const titles = [mainTitle, englishTitle].filter(Boolean)
        let bestMatch = animeFromSearch.title // Valor por defecto
        
        for (const title of titles) {
          if (title && title.toLowerCase().includes(searchName)) {
            bestMatch = title
            if (title.toLowerCase() === searchName) {
              break // Coincidencia exacta
            }
          }
        }

        return bestMatch
      }, name)

      return NextResponse.json({
        success: true,
        mal_id: animeFromSearch.id,
        title: improvedTitle,
        url: animeFromSearch.url,
        search_method: 'direct_search'
      })
    }

    // Estrategia 2: Búsqueda por temporada (si tenemos los datos y no es anime en emisión)
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
              return {
                id: idMatch[1],
                title: titleEl.textContent?.trim(),
                url: link
              }
            }
          }
        }
        return null
      }, name)

      if (animeFromSeason) {
        // Obtener información detallada también para búsqueda por temporada
        await page.goto(`https://myanimelist.net${animeFromSeason.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        })

        const improvedTitle = await page.evaluate((searchName) => {
          const titleDiv = document.querySelector('div[itemprop="name"]')
          const mainTitle = titleDiv?.querySelector('h1.title-name strong')?.textContent?.trim()
          const englishTitle = titleDiv?.querySelector('p.title-english')?.textContent?.trim()
          
          const titles = [mainTitle, englishTitle].filter(Boolean)
          let bestMatch = animeFromSeason.title // Valor por defecto
          
          for (const title of titles) {
            if (title && title.toLowerCase().includes(searchName)) {
              bestMatch = title
              if (title.toLowerCase() === searchName) {
                break // Coincidencia exacta
              }
            }
          }

          return bestMatch
        }, name)

        return NextResponse.json({
          success: true,
          mal_id: animeFromSeason.id,
          title: improvedTitle,
          url: animeFromSeason.url,
          search_method: 'season_search'
        })
      }
    }

    // Estrategia 3: Búsqueda en animes actualmente en emisión
    await page.goto('https://myanimelist.net/anime/season', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    })

    const currentlyAiringAnime = await page.evaluate((searchName) => {
      const items = Array.from(document.querySelectorAll('.seasonal-anime'))
      for (const item of items) {
        const titleEl = item.querySelector('.title a') || item.querySelector('a.link-title')
        const title = titleEl?.textContent?.toLowerCase()
        const link = titleEl?.getAttribute('href')
        if (title?.includes(searchName) && link) {
          const idMatch = link.match(/anime\/(\d+)/)
          if (idMatch) {
            return {
              id: idMatch[1],
              title: titleEl.textContent?.trim(),
              url: link
            }
          }
        }
      }
      return null
    }, name)

    if (currentlyAiringAnime) {
      await page.goto(`https://myanimelist.net${currentlyAiringAnime.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      const detailedInfo = await page.evaluate((searchName) => {
        const titleDiv = document.querySelector('div[itemprop="name"]')
        const mainTitle = titleDiv?.querySelector('h1.title-name strong')?.textContent?.trim()
        const englishTitle = titleDiv?.querySelector('p.title-english')?.textContent?.trim()
        
        const titles = [mainTitle, englishTitle].filter(Boolean)
        let bestMatch = null
        let exactMatch = false
        
        for (const title of titles) {
          if (title && title.toLowerCase().includes(searchName)) {
            bestMatch = title
            if (title.toLowerCase() === searchName) {
              exactMatch = true
              break
            }
          }
        }

        const statusElement = Array.from(document.querySelectorAll('.spaceit_pad')).find(el => 
          el.querySelector('.dark_text')?.textContent?.includes('Status:')
        )
        const status = statusElement?.textContent?.replace('Status:', '').trim() || 'Currently Airing'
        
        const episodesElement = Array.from(document.querySelectorAll('.spaceit_pad')).find(el => 
          el.querySelector('.dark_text')?.textContent?.includes('Episodes:')
        )
        const episodes = episodesElement?.textContent?.replace('Episodes:', '').trim() || 'Unknown'

        return {
          mainTitle,
          englishTitle,
          bestMatch,
          exactMatch,
          status,
          episodes,
          titles
        }
      }, name)

      return NextResponse.json({
        success: true,
        mal_id: currentlyAiringAnime.id,
        title: detailedInfo.bestMatch || currentlyAiringAnime.title,
        main_title: detailedInfo.mainTitle,
        english_title: detailedInfo.englishTitle,
        all_titles: detailedInfo.titles,
        url: currentlyAiringAnime.url,
        status: detailedInfo.status,
        currently_airing: true,
        episodes: detailedInfo.episodes,
        season: 'Current Season',
        exact_match: detailedInfo.exactMatch,
        search_method: 'current_airing_search'
      })
    }

    // Si todo falla
    return NextResponse.json(
      {
        error: 'Anime no encontrado',
        suggestions: [
          'Verifica la ortografía del nombre',
          'Intenta con el nombre en inglés/japonés',
          'Prueba sin acentos o caracteres especiales',
          'Verifica si el anime está actualmente en emisión',
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