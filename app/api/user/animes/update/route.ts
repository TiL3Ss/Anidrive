// app/api/user/animes/update/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Opciones estáticas (deben coincidir con las de los modales)
const STATES_VIEW_OPTIONS = [
  { id: 1, name: 'Viendo' }, { id: 2, name: 'Terminado' }, { id: 3, name: 'Pendiente' }, { id: 4, name: 'Abandonado' }
];

const RATINGS_OPTIONS = [
  { id: 1, value: '1★' }, { id: 2, value: '2★' }, { id: 3, value: '3★' }, { id: 4, value: '4★' }, { id: 5, value: '5★' }
];

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const {
    animeId,
    currentChapter,
    stateId,
    rateId,
  } = await request.json();

  if (!animeId || currentChapter === undefined || !stateId) { 
    return NextResponse.json({ message: 'Campos requeridos faltantes para la actualización.' }, { status: 400 });
  }

  try {
    const client = getTursoClient();

    // Mapear IDs a nombres/valores para almacenar en la DB
    const stateName = STATES_VIEW_OPTIONS.find(s => s.id === stateId)?.name || null;
    const ratingValue = RATINGS_OPTIONS.find(r => r.id === rateId)?.value || null;

    if (!stateName) {
        return NextResponse.json({ message: 'Valor de estado inválido.' }, { status: 400 });
    }

    const result = await client.execute({
      sql: `UPDATE user_animes
           SET current_chapter = ?, state_name = ?, rating_value = ?
           WHERE user_id = ? AND anime_id = ?`,
      args: [currentChapter, stateName, ratingValue, userId, animeId]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ message: 'No se encontró el anime para actualizar o no hubo cambios.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Anime actualizado con éxito.' });

  } catch (error: any) {
    console.error('Error updating anime for user:', error);
    return NextResponse.json({ message: 'Error interno del servidor al actualizar anime.', detail: error.message }, { status: 500 });
  }
}