// app/api/user/animes/update-review/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const { animeId, review } = await request.json();

  if (!animeId || review === undefined) { 
    return NextResponse.json({ message: 'Campos requeridos faltantes para la actualización de review.' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // Verificar que el anime existe para este usuario
    const existingRecord = await db.get(
      `SELECT id FROM user_animes WHERE user_id = ? AND anime_id = ?`,
      [userId, animeId]
    );

    if (!existingRecord) {
      return NextResponse.json({ message: 'No se encontró el anime para este usuario.' }, { status: 404 });
    }

    // Actualizar solo la review
    const result = await db.run(
      `UPDATE user_animes
       SET review = ?
       WHERE user_id = ? AND anime_id = ?`,
      [review.trim() || null, userId, animeId]
    );

    if (result.changes === 0) {
      return NextResponse.json({ message: 'No se pudo actualizar la review.' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Review actualizada con éxito.',
      review: review.trim() || null
    });

  } catch (error: any) {
    console.error('Error updating anime review for user:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al actualizar review.', 
      detail: error.message 
    }, { status: 500 });
  }
}