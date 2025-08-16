// app/api/comments/[commentId]/replies/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { commentId } = params;

  if (!commentId) {
    return NextResponse.json({ 
      message: 'commentId es requerido' 
    }, { status: 400 });
  }

  try {
    const db = await getDb();

    // Verificar que el comentario padre existe
    const parentComment = await db.get(
      `SELECT * FROM anime_comments WHERE id = ?`,
      [commentId]
    );

    if (!parentComment) {
      return NextResponse.json({ 
        message: 'Comentario no encontrado' 
      }, { status: 404 });
    }

    // Obtener las respuestas del comentario con información del usuario y votos
    const replies = await db.all(`
      SELECT 
        c.*,
        u.username as commenter_name,
        NULL as commenter_image,
        COALESCE(cv.vote_type, 0) as user_vote
      FROM anime_comments c
      JOIN users u ON c.commenter_id = u.id
      LEFT JOIN comment_votes cv ON c.id = cv.comment_id AND cv.user_id = ?
      WHERE c.parent_comment_id = ?
      ORDER BY c.created_at ASC
    `, [session.user.id, commentId]);

    return NextResponse.json({ replies });

  } catch (error: any) {
    console.error('Error getting comment replies:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al obtener respuestas',
      detail: error.message 
    }, { status: 500 });
  }
}