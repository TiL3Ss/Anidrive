// app/api/user/animes/search-mal/route.ts
import { NextResponse } from 'next/server'
import { searchMALAnime } from '../../../../lib/malSearchService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const name = searchParams.get('name') || ''
  const season = searchParams.get('season') || '1'
  const seasonName = searchParams.get('season_name') || ''
  const year = searchParams.get('year') || ''

  if (!name) {
    return NextResponse.json({ 
      error: 'El parámetro "name" es requerido' 
    }, { status: 400 })
  }

  try {
    const result = await searchMALAnime({
      name,
      season,
      seasonName,
      year
    })

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(
      {
        error: result.error || 'Anime no encontrado',
        suggestions: [
          'Verifica la ortografía del nombre',
          'Intenta con el nombre en inglés o japonés',
          'Prueba sin acentos o caracteres especiales',
        ],
        attempted_params: {
          name,
          season,
          seasonName,
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
      },
      { status: 500 }
    )
  }
}