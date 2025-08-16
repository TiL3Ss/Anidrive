// app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getTursoClient } from '../../lib/turso';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, animeId, content, parentCommentId } = body;

    if (!userId || !animeId || !content) {
      return NextResponse.json({ 
        message: 'userId, animeId y content son requeridos' 
      }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ 
        message: 'El contenido del comentario no puede estar vacío' 
      }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ 
        message: 'El comentario no puede exceder 1000 caracteres' 
      }, { status: 400 });
    }

    const client = getTursoClient();

    // Verificar que el anime existe en la lista del usuario
    const userAnimeResult = await client.execute({
      sql: `SELECT * FROM user_animes WHERE user_id = ? AND anime_id = ?`,
      args: [userId, animeId]
    });

    if (userAnimeResult.rows.length === 0) {
      return NextResponse.json({ 
        message: 'No se puede comentar en un anime que no está en la lista del usuario' 
      }, { status: 404 });
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (parentCommentId) {
      const parentCommentResult = await client.execute({
        sql: `SELECT * FROM anime_comments WHERE id = ? AND user_id = ? AND anime_id = ?`,
        args: [parentCommentId, userId, animeId]
      });

      if (parentCommentResult.rows.length === 0) {
        return NextResponse.json({ 
          message: 'Comentario padre no encontrado' 
        }, { status: 404 });
      }
    }

    // Crear el comentario
    const result = await client.execute({
      sql: `INSERT INTO anime_comments (user_id, anime_id, commenter_id, parent_comment_id, content)
           VALUES (?, ?, ?, ?, ?)`,
      args: [userId, animeId, session.user.id, parentCommentId || null, content.trim()]
    });

    // Obtener el comentario creado con información del usuario
    const newCommentResult = await client.execute({
      sql: `SELECT 
              c.*,
              u.username as commenter_name,
              NULL as commenter_image
            FROM anime_comments c
            JOIN users u ON c.commenter_id = u.id
            WHERE c.id = ?`,
      args: [result.lastInsertRowid]
    });

    const newComment = newCommentResult.rows[0];

    return NextResponse.json({
      message: 'Comentario creado exitosamente',
      comment: {
        ...newComment,
        like_count: 0,
        dislike_count: 0,
        user_vote: null
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al crear comentario',
      detail: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const animeId = searchParams.get('anime_id');

  if (!userId || !animeId) {
    return NextResponse.json({ 
      message: 'user_id y anime_id son requeridos' 
    }, { status: 400 });
  }

  try {
    const client = getTursoClient();

    // Obtener comentarios principales (sin parent_comment_id) con información del usuario y votos
    const commentsResult = await client.execute({
      sql: `SELECT 
              c.*,
              u.username as commenter_name,
              NULL as commenter_image,
              COALESCE(cv.vote_type, 0) as user_vote,
              (SELECT COUNT(*) FROM anime_comments WHERE parent_comment_id = c.id) as reply_count
            FROM anime_comments c
            JOIN users u ON c.commenter_id = u.id
            LEFT JOIN comment_votes cv ON c.id = cv.comment_id AND cv.user_id = ?
            WHERE c.user_id = ? AND c.anime_id = ? AND c.parent_comment_id IS NULL
            ORDER BY c.created_at DESC`,
      args: [session.user.id, userId, animeId]
    });

    const comments = commentsResult.rows;

    return NextResponse.json({ comments });

  } catch (error: any) {
    console.error('Error getting comments:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor al obtener comentarios',
      detail: error.message 
    }, { status: 500 });
  }
}