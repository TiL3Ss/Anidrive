// app/api/user/animes/delete/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const { animeId } = await request.json();

  if (!animeId) {
    return NextResponse.json(
      { message: 'Se requiere el ID del anime' },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();

    // 1. Verificar que el anime exista en la colección del usuario
    const userAnime = await db.get(
      'SELECT id FROM user_animes WHERE user_id = ? AND anime_id = ?',
      [userId, animeId]
    );

    if (!userAnime) {
      return NextResponse.json(
        { message: 'El anime no existe en tu colección' },
        { status: 404 }
      );
    }

    // 2. Eliminar solo la relación usuario-anime
    const result = await db.run(
      'DELETE FROM user_animes WHERE user_id = ? AND anime_id = ?',
      [userId, animeId]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { message: 'No se encontró el anime para eliminar' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Anime eliminado de tu colección exitosamente',
      deleted: true
    });

  } catch (error: any) {
    console.error('Error deleting anime:', error);
    return NextResponse.json(
      { 
        message: 'Error al eliminar el anime',
        details: error.message 
      },
      { status: 500 }
    );
  }
}