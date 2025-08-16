// app/api/comments/[commentId]/vote/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
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
    const body = await request.json();
    const { voteType } = body; // 1 para like, -1 para dislike, 0 para remover voto

    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      return NextResponse.json({ 
        message: 'voteType debe ser 1 (like), -1 (dislike) o 0 (remover)' 
      }, { status: 400 });
    }

    const db = await getDb();

    // Verificar que el comentario existe
    const comment = await db.get(
      `SELECT * FROM anime_comments WHERE id = ?`,
      [commentId]
    );

    if (!comment) {
      return NextResponse.json({ 
        message: 'Comentario no encontrado' 
      }, { status: 404 });
    }

    // No permitir votar en sus propios comentarios
    if (comment.commenter_id === session.user.id) {
      return NextResponse.json({ 
        message: 'No puedes votar en tus propios comentarios' 
      }, { status: 403 });
    }

    // Obtener voto actual del usuario
    const currentVote = await db.get(
      `SELECT vote_type FROM comment_votes WHERE user_id = ? AND comment_id = ?`,
      [session.user.id, commentId]
    );

    await db.run('BEGIN TRANSACTION');

    try {
      // Si voteType es 0, remover el voto
      if (voteType === 0) {
        if (currentVote) {
          await db.run(
            `DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?`,
            [session.user.id, commentId]
          );

          // Actualizar contadores
          if (currentVote.vote_type === 1) {
            await db.run(
              `UPDATE anime_comments SET like_count = like_count - 1 WHERE id = ?`,
              [commentId]
            );
          } else {
            await db.run(
              `UPDATE anime_comments SET dislike_count = dislike_count - 1 WHERE id = ?`,
              [commentId]
            );
          }
        }
      } else {
        // Insertar o actualizar voto
        if (currentVote) {
          // Actualizar voto existente
          const oldVoteType = currentVote.vote_type;
          
          await db.run(
            `UPDATE comment_votes SET vote_type = ? WHERE user_id = ? AND comment_id = ?`,
            [voteType, session.user.id, commentId]
          );

          // Actualizar contadores
          if (oldVoteType === 1 && voteType === -1) {
            // Cambiar de like a dislike
            await db.run(
              `UPDATE anime_comments SET like_count = like_count - 1, dislike_count = dislike_count + 1 WHERE id = ?`,
              [commentId]
            );
          } else if (oldVoteType === -1 && voteType === 1) {
            // Cambiar de dislike a like
            await db.run(
              `UPDATE anime_comments SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE id = ?`,
              [commentId]
            );
          }
        } else {
          // Insertar nuevo voto
          await db.run(
            `INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES (?, ?, ?)`,
            [session.user.id, commentId, voteType]
          );

          // Actualizar contadores
          if (voteType === 1) {
            await db.run(
              `UPDATE anime_comments SET like_count = like_count + 1 WHERE id = ?`,
              [commentId]
            );
          } else {
            await db.run(
              `UPDATE anime_comments SET dislike_count = dislike_count + 1 WHERE id = ?`,
              [commentId]
            );
          }
        }
      }

      await db.run('COMMIT');

      // Obtener contadores actualizados
      const updatedComment = await db.get(
        `SELECT like_count, dislike_count FROM anime_comments WHERE id = ?`,
        [commentId]
      );

      return NextResponse.json({
        message: 'Voto registrado exitosamente',
        likeCount: updatedComment.like_count,
        dislikeCount: updatedComment.dislike_count,
        userVote: voteType
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error voting on comment:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al votar',
      detail: error.message 
    }, { status: 500 });
  }
}