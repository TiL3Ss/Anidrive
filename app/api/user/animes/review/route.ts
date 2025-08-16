// app/api/user/animes/review/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get('animeId');
  const userId = searchParams.get('userId'); // Nuevo parámetro para obtener reseñas de otros usuarios

  if (!animeId) {
    return NextResponse.json({ message: 'animeId es requerido' }, { status: 400 });
  }

  // Si se proporciona userId, usar ese; si no, usar el del usuario actual (sesión)
  const targetUserId = userId ? parseInt(userId) : session.user.id;

  try {
    const client = getTursoClient();

    // Obtener la review del usuario especificado para este anime
    const result = await client.execute({
      sql: `SELECT review FROM user_animes WHERE user_id = ? AND anime_id = ?`,
      args: [targetUserId, parseInt(animeId)]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'No se encontró el anime para este usuario.' }, { status: 404 });
    }

    const reviewData = result.rows[0];

    return NextResponse.json({ 
      review: reviewData.review 
    });

  } catch (error: any) {
    console.error('Error getting anime review for user:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al obtener review.', 
      detail: error.message 
    }, { status: 500 });
  }
}