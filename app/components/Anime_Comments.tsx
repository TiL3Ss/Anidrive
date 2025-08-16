// components/Anime_Comments.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolid, 
  HandThumbDownIcon as HandThumbDownSolid 
} from '@heroicons/react/24/solid';

interface Comment {
  id: number;
  user_id: number;
  anime_id: number;
  commenter_id: number;
  parent_comment_id: number | null;
  content: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
  updated_at: string;
  commenter_name: string;
  commenter_image: string | null;
  user_vote: number; // 1 = like, -1 = dislike, 0 = no vote
  reply_count?: number;
}

interface AnimeCommentsProps {
  userId: number;
  animeId: number;
  animeTitle: string;
  isOwnProfile: boolean;
  currentUserId: number;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  currentUserId: number;
  onVote: (commentId: number, voteType: number) => void;
  onToggleReplyForm: (commentId: number) => void;
  onToggleReplies: (commentId: number) => void;
  onSubmitReply: (e: React.FormEvent, parentCommentId: number) => void;
  onReplyTextChange: (commentId: number, value: string) => void;
  showingReplyForm: number | null;
  submittingReply: number | null;
  replyTexts: { [commentId: number]: string };
  expandedReplies: Set<number>;
  replies: { [commentId: number]: Comment[] };
  loadingReplies: Set<number>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CommentItem: React.FC<CommentItemProps> = React.memo(function CommentItem({ 
  comment, 
  isReply = false,
  currentUserId,
  onVote,
  onToggleReplyForm,
  onToggleReplies,
  onSubmitReply,
  onReplyTextChange,
  showingReplyForm,
  submittingReply,
  replyTexts,
  expandedReplies,
  replies,
  loadingReplies
}) {
  return (
    <div className={`bg-white p-4 rounded-[2rem] shadow-sm border ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}> 
      <div className="flex items-start space-x-3 ">
        <div className="flex-shrink-0">
          {comment.commenter_image ? (
            <img
              src={comment.commenter_image}
              alt={comment.commenter_name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 ">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">{comment.commenter_name}</span>
            <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
          
          <p className="text-gray-700 mb-3">{comment.content}</p>
          
          <div className="flex items-center space-x-4">
            {/* Botones de voto */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onVote(comment.id, comment.user_vote === 1 ? 0 : 1)}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition duration-200 ${
                  comment.user_vote === 1 
                    ? 'bg-green-100 text-green-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                disabled={comment.commenter_id === currentUserId}
              >
                {comment.user_vote === 1 ? (
                  <HandThumbUpSolid className="h-4 w-4" />
                ) : (
                  <HandThumbUpIcon className="h-4 w-4" />
                )}
                <span className="text-sm">{comment.like_count}</span>
              </button>
              
              <button
                onClick={() => onVote(comment.id, comment.user_vote === -1 ? 0 : -1)}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition duration-200 ${
                  comment.user_vote === -1 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                disabled={comment.commenter_id === currentUserId}
              >
                {comment.user_vote === -1 ? (
                  <HandThumbDownSolid className="h-4 w-4" />
                ) : (
                  <HandThumbDownIcon className="h-4 w-4" />
                )}
                <span className="text-sm">{comment.dislike_count}</span>
              </button>
            </div>
            
            {/* Botón de responder (solo en comentarios principales) */}
            {!isReply && (
              <button
                onClick={() => onToggleReplyForm(comment.id)}
                className="text-sm text-blue-600 hover:text-blue-800 transition duration-200"
              >
                Responder
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Formulario de respuesta */}
      {!isReply && showingReplyForm === comment.id && (
        <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="mt-4 ml-11">
          <div className="flex space-x-2">
            <textarea
              value={replyTexts[comment.id] || ''}
              onChange={(e) => onReplyTextChange(comment.id, e.target.value)}
              placeholder="Escribe una respuesta..."
              className="w-full h-16 px-5 py-3 text-gray-700 border-2 border-gray-300 rounded-[2rem] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              rows={2}
              maxLength={1000}
              autoFocus
            />
            <button
              type="submit"
              disabled={!replyTexts[comment.id]?.trim() || submittingReply === comment.id}
              className="bg-blue-600 text-white mt-2 p-3 rounded-full hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm shadow-sm hover:shadow-md h-12 w-12"
            >
              {submittingReply === comment.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      )}
      
      {/* Mostrar respuestas */}
      {!isReply && comment.reply_count && comment.reply_count > 0 && (
        <div className="mt-3 ml-11">
          <button
            onClick={() => onToggleReplies(comment.id)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition duration-200"
          >
            {expandedReplies.has(comment.id) ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                <span>Ocultar respuestas ({comment.reply_count})</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                <span>Ver respuestas ({comment.reply_count})</span>
              </>
            )}
          </button>
          
          {expandedReplies.has(comment.id) && (
            <div className="mt-2">
              {loadingReplies.has(comment.id) ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-500">Cargando respuestas...</span>
                </div>
              ) : (
                replies[comment.id]?.map(reply => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    isReply={true}
                    currentUserId={currentUserId}
                    onVote={onVote}
                    onToggleReplyForm={onToggleReplyForm}
                    onToggleReplies={onToggleReplies}
                    onSubmitReply={onSubmitReply}
                    onReplyTextChange={onReplyTextChange}
                    showingReplyForm={showingReplyForm}
                    submittingReply={submittingReply}
                    replyTexts={replyTexts}
                    expandedReplies={expandedReplies}
                    replies={replies}
                    loadingReplies={loadingReplies}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const Anime_Comments: React.FC<AnimeCommentsProps> = ({
  userId,
  animeId,
  animeTitle,
  isOwnProfile,
  currentUserId
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<{ [commentId: number]: Comment[] }>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
  const [replyTexts, setReplyTexts] = useState<{ [commentId: number]: string }>({});
  const [showingReplyForm, setShowingReplyForm] = useState<number | null>(null);
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  // Cargar comentarios
  useEffect(() => {
    loadComments();
  }, [userId, animeId]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?user_id=${userId}&anime_id=${animeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      } else {
        console.error('Error al cargar comentarios');
      }
    } catch (error) {
      console.error('Error de red al cargar comentarios:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadReplies = async (commentId: number) => {
    if (loadingReplies.has(commentId)) return;
    
    try {
      setLoadingReplies(prev => new Set(prev).add(commentId));
      const response = await fetch(`/api/comments/${commentId}/replies`);
      
      if (response.ok) {
        const data = await response.json();
        setReplies(prev => ({ ...prev, [commentId]: data.replies }));
      } else {
        console.error('Error al cargar respuestas');
      }
    } catch (error) {
      console.error('Error de red al cargar respuestas:', error);
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          animeId,
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      } else {
        const errorData = await response.json();
        alert('Error al crear comentario: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error de red al crear comentario:', error);
      alert('Error de conexión al crear comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = useCallback(async (e: React.FormEvent, parentCommentId: number) => {
    e.preventDefault();
    const replyText = replyTexts[parentCommentId];
    if (!replyText?.trim() || submittingReply === parentCommentId) return;

    try {
      setSubmittingReply(parentCommentId);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          animeId,
          content: replyText.trim(),
          parentCommentId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReplies(prev => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), data.comment]
        }));
        setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
        setShowingReplyForm(null);
        
        // Actualizar el contador de respuestas en el comentario padre
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId 
            ? { ...comment, reply_count: (comment.reply_count || 0) + 1 }
            : comment
        ));
      } else {
        const errorData = await response.json();
        alert('Error al crear respuesta: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error de red al crear respuesta:', error);
      alert('Error de conexión al crear respuesta');
    } finally {
      setSubmittingReply(null);
    }
  }, [userId, animeId, replyTexts, submittingReply]);

  const handleVote = useCallback(async (commentId: number, voteType: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar comentario principal o respuesta
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                like_count: data.likeCount,
                dislike_count: data.dislikeCount,
                user_vote: data.userVote
              }
            : comment
        ));

        // Actualizar respuestas si existe
        setReplies(prev => {
          const newReplies = { ...prev };
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parseInt(parentId)] = newReplies[parseInt(parentId)].map(reply =>
              reply.id === commentId
                ? {
                    ...reply,
                    like_count: data.likeCount,
                    dislike_count: data.dislikeCount,
                    user_vote: data.userVote
                  }
                : reply
            );
          });
          return newReplies;
        });
      } else {
        const errorData = await response.json();
        alert('Error al votar: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error de red al votar:', error);
      alert('Error de conexión al votar');
    }
  }, []);

  const handleToggleReplies = useCallback(async (commentId: number) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setExpandedReplies(prev => new Set(prev).add(commentId));
      if (!replies[commentId]) {
        await loadReplies(commentId);
      }
    }
  }, [expandedReplies, replies]);

  const handleToggleReplyForm = useCallback((commentId: number) => {
    setShowingReplyForm(showingReplyForm === commentId ? null : commentId);
  }, [showingReplyForm]);

  const handleReplyTextChange = useCallback((commentId: number, value: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: value }));
  }, []);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
        <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-blue-500" />
        Comentarios sobre {animeTitle}
      </h3>

      {/* Formulario para nuevo comentario */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="bg-white  p-4 rounded-lg shadow-sm border">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario sobre este anime..."
            className="w-full h-24 px-5 py-3 text-gray-700 border-2 border-gray-300 rounded-[2rem] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-3">
            <div className="text-sm text-gray-500">
              {newComment.length}/1000 caracteres
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {isSubmittingComment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Comentar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de comentarios */}
      {isLoadingComments ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Cargando comentarios...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">
            Aún no hay comentarios para este anime.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            ¡Sé el primero en comentar!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              currentUserId={currentUserId}
              onVote={handleVote}
              onToggleReplyForm={handleToggleReplyForm}
              onToggleReplies={handleToggleReplies}
              onSubmitReply={handleSubmitReply}
              onReplyTextChange={handleReplyTextChange}
              showingReplyForm={showingReplyForm}
              submittingReply={submittingReply}
              replyTexts={replyTexts}
              expandedReplies={expandedReplies}
              replies={replies}
              loadingReplies={loadingReplies}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Anime_Comments;