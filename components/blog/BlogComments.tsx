'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Heart, Flag } from 'lucide-react';
import { BlogComment } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface BlogCommentsProps {
  postId: string;
  comments: BlogComment[];
}

export function BlogComments({ postId, comments }: BlogCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función auxiliar para obtener una fecha segura
  const getSafeDate = (value: any): Date | null => {
    if (!value) {
      return null; // Maneja null, undefined, ""
    }

    // Si ya es un objeto Date
    if (value instanceof Date) {
      return value;
    }

    // Si es un Timestamp de Firestore (común si los datos vienen del servidor)
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }

    // Intenta parsear strings (ISO) o números (milliseconds)
    const date = new Date(value);

    // Comprueba si el resultado es una fecha válida
    if (isNaN(date.getTime())) {
      return null; // El string era inválido (ej. "hola")
    }

    return date;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement comment submission
      console.log('Submitting comment:', newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-xl font-semibold">
          Comentarios ({comments.length})
        </h3>
      </div>

      {/* Comment form */}
      {user ? (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar comentario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Inicia sesión para dejar un comentario
            </p>
            <Button asChild>
              <a href="/login">Iniciar sesión</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => {
          // Obtén la fecha para este comentario específico
          const commentDate = getSafeDate(comment.createdAt);

          return (
            <Card key={comment.id}>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userImageUrl} />
                    <AvatarFallback>
                      {comment.userName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{comment.userName}</span>
                      <time
                        dateTime={commentDate ? commentDate.toISOString() : undefined}
                        className="text-sm text-muted-foreground"
                      >
                        {commentDate
                          ? format(commentDate, 'dd MMM yyyy', { locale: es })
                          : '(Fecha desconocida)'
                        }
                      </time>
                    </div>
                  <p className="text-sm mb-3">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Heart className="h-3 w-3 mr-1" />
                      {comment.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                      <Flag className="h-3 w-3 mr-1" />
                      Reportar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}

        {comments.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Sé el primero en comentar este artículo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}