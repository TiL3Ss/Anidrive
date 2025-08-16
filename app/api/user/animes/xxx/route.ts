// app/api/user/animes/fetch-image/route.ts
import { chromium } from 'playwright'
import { NextResponse } from 'next/server'

const cache = new Map()
const TIMEOUT_MS = 8000 // 8 segundos máximo

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const animeId = searchParams.get('id')

  if (!animeId) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro "id"' },
      { status: 400 }
    )
  }

  // Verificar caché
  if (cache.has(animeId)) {
    return NextResponse.json(cache.get(animeId))
  }

  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    })

    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Configuración optimizada
    await page.goto(`https://myanimelist.net/anime/${animeId}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_MS
    })

    // Extraer datos con selectores específicos para MAL
    const { name_mal, image_url } = await page.evaluate(() => {
      // 1. Obtener título
      const title = document.querySelector('h1.title-name strong')?.textContent?.trim() || 
                   document.querySelector('h1.title-name')?.textContent?.trim() || 
                   null

      // 2. Obtener imagen (selector mejorado)
      const imgElement = document.querySelector('img[itemprop="image"]') as HTMLImageElement || 
                        document.querySelector('.leftside img[src*="myanimelist.net/images/anime"]') as HTMLImageElement
      
      // Probar diferentes atributos de la imagen
      const imageSrc = imgElement?.src || 
                      imgElement?.getAttribute('data-src') || 
                      null

      return {
        name_mal: title,
        image_url: imageSrc
      }
    })

    // Validación de datos
    if (!name_mal || !image_url) {
      throw new Error(`Datos incompletos: ${JSON.stringify({ name_mal, image_url })}`)
    }

    // Formatear respuesta
    const responseData = {
      name_mal,
      image_url: image_url.includes('cdn.myanimelist.net') ? 
                image_url : 
                'https://cdn.myanimelist.net/images/anime/1141/142503.jpg'
    }

    // Almacenar en caché (10 minutos)
    cache.set(animeId, responseData)
    setTimeout(() => cache.delete(animeId), 600000)

    return NextResponse.json(responseData)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error(`Error fetching anime ${animeId}:`, errorMessage)
    
    return NextResponse.json(
      { 
        error: 'Error al obtener datos del anime',
        animeId,
        details: errorMessage,
        suggestions: [
          'Verifica que el anime exista en MyAnimeList',
          'Intenta recargar la página',
          'El sitio puede estar temporalmente no disponible'
        ]
      },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close().catch(console.error)
  }
}