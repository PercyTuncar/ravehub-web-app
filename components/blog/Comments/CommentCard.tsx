'use client';

import { useState } from 'react';
import { BlogComment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pin, MessageCircle, Heart, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CommentInput } from './CommentInput';
import { toggleLikeComment, updateComment, deleteComment, pinComment } from '@/lib/actions/blog-actions';
import { Trash2, Pin as PinIcon, Flag, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface CommentCardProps {
    comment: BlogComment;
    postId: string;
    currentUser?: {
        id: string;
        name: string;
        imageUrl?: string;
        email?: string;
        role?: 'user' | 'admin' | 'moderator';
    };
    children?: React.ReactNode;
    onReply?: () => void;
    onDelete?: (commentId: string) => void;
}

export function CommentCard({ comment, postId, currentUser, children, onReply, onDelete }: CommentCardProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState(comment.content);
    const [likes, setLikes] = useState(comment.likes);
    const [isLiked, setIsLiked] = useState(currentUser ? comment.likedBy?.includes(currentUser.id) : false);
    const [isPinned, setIsPinned] = useState(comment.isPinned);

    const isAdmin = currentUser?.role === 'admin';
    const isModerator = currentUser?.role === 'moderator';
    const isAuthor = currentUser?.id === comment.userId;
    const canDelete = isAdmin || isModerator || isAuthor;
    const canPin = isAdmin; // Only admins can pin
    const canEdit = isAuthor; // Only author can edit

    const handleEditSubmit = async (content: string) => {
        const result = await updateComment(comment.id, content);
        if (result.success) {
            setEditingContent(content);
            setIsEditing(false);
        }
        return result;
    };

    const handleLike = async () => {
        if (!currentUser) return toast.error('Inicia sesión para dar like');

        // Optimistic update
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikes((prev: number) => (newLikedState ? prev + 1 : prev - 1));

        const result = await toggleLikeComment(comment.id, currentUser.id);
        if (!result.success) {
            // Revert if failed
            setIsLiked(!newLikedState);
            setLikes((prev: number) => (!newLikedState ? prev + 1 : prev - 1));
            toast.error('Error al dar like');
        }
    };

    const handlePin = async () => {
        if (!canPin) return;
        const newPinnedState = !isPinned;
        setIsPinned(newPinnedState);
        toast.promise(pinComment(comment.id, newPinnedState), {
            loading: newPinnedState ? 'Fijando comentario...' : 'Desfijando comentario...',
            success: newPinnedState ? 'Comentario fijado' : 'Comentario desfijado',
            error: 'Error al actualizar estado'
        });
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

        const result = await deleteComment(comment.id);
        if (result.success) {
            toast.success('Comentario eliminado');
            onDelete?.(comment.id);
        } else {
            toast.error('Error al eliminar comentario');
        }
    };

    const handleReplySuccess = () => {
        setIsReplying(false);
        toast.success('Respuesta enviada!');
        onReply?.();
    };

    const getRoleBadge = (role?: string) => {
        if (role === 'admin' || role === 'moderator') {
            return (
                <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded ml-2 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    {role === 'admin' ? 'Staff Ravehub' : 'Moderador'}
                </span>
            );
        }
        return null;
    };

    // Convert Firestore Timestamp to JS Date if necessary
    const createdAtDate = comment.createdAt instanceof Date
        ? comment.createdAt
        : new Date((comment.createdAt as any).seconds * 1000);



    return (
        <div className={cn(
            "group relative flex flex-col p-5 rounded-2xl transition-all duration-300",
            isPinned
                ? "bg-primary/5 border border-primary/30 shadow-[0_0_20px_-10px_rgba(var(--primary-rgb),0.2)]"
                : "hover:bg-white/5 border border-transparent"
        )}>
            {/* Pinned Icon Absolute - Adjusted position */}
            {isPinned && (
                <div className="absolute -top-2.5 right-4 bg-zinc-950 border border-primary/30 text-primary px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 z-10">
                    <Pin className="w-3 h-3 fill-current" />
                    Fijado
                </div>
            )}

            <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 pt-1">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-zinc-900 ring-2 ring-white/10">
                        <AvatarImage src={comment.userImageUrl} alt={comment.userName} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-gray-300 font-medium text-sm">
                            {comment.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 pr-16 sm:pr-0">
                        <span className={cn(
                            "font-bold text-sm sm:text-base text-gray-100",
                            comment.authorRole === 'admin' && "text-white"
                        )}>
                            {comment.userName}
                        </span>

                        {/* Role Badge */}
                        {getRoleBadge(comment.authorRole)}

                        <span className="text-xs text-gray-500 font-medium ml-1" suppressHydrationWarning>
                            {formatDistanceToNow(createdAtDate, { addSuffix: true, locale: es })}
                        </span>
                    </div>

                    {/* Comment Text OR Edit Input */}
                    {isEditing ? (
                        <div className="mt-2">
                            <CommentInput
                                postId={postId}
                                currentUser={currentUser}
                                initialValue={editingContent}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setIsEditing(false)}
                                autoFocus
                                className="pl-0"
                            />
                        </div>
                    ) : (
                        <div className="text-gray-300 text-sm sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {editingContent}
                        </div>
                    )}

                    {/* Actions Footer */}
                    {!isEditing && (
                        <div className="flex items-center gap-5 pt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLike}
                                className={cn(
                                    "h-8 px-2 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
                                    isLiked
                                        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-500"
                                        : "text-gray-500 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                                <span>{likes > 0 ? likes : 'Me gusta'}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsReplying(!isReplying)}
                                className="h-8 px-2 rounded-full flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Responder</span>
                            </Button>

                            {/* Menu - Admin Actions */}
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white rounded-full hover:bg-white/10">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-gray-200">
                                        {canPin && (
                                            <DropdownMenuItem onClick={handlePin} className="text-xs cursor-pointer focus:bg-white/10 focus:text-white gap-2">
                                                <PinIcon className="w-3.5 h-3.5" />
                                                {isPinned ? 'Desfijar comentario' : 'Fijar comentario'}
                                            </DropdownMenuItem>
                                        )}
                                        {canEdit && (
                                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs cursor-pointer focus:bg-white/10 focus:text-white gap-2">
                                                <Pencil className="w-3.5 h-3.5" />
                                                Editar
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-xs cursor-pointer focus:bg-white/10 focus:text-white gap-2" onClick={() => {
                                            toast.success('Reporte enviado');
                                        }}>
                                            <Flag className="w-3.5 h-3.5" />
                                            Reportar
                                        </DropdownMenuItem>
                                        {canDelete && (
                                            <>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem onClick={handleDelete} className="text-xs cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reply Input - Now outside the flex row, taking full width */}
            {isReplying && !isEditing && (
                <div className="w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-200 pl-14 sm:pl-16">
                    <CommentInput
                        postId={postId}
                        parentId={comment.id}
                        currentUser={currentUser}
                        onSuccess={handleReplySuccess}
                        onCancel={() => setIsReplying(false)}
                        autoFocus
                        className="pl-0"
                    />
                </div>
            )}
        </div>
    );
}
