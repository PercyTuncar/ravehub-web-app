'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is installed based on package.json
import { createComment } from '@/lib/actions/blog-actions';

const commentSchema = z.object({
    content: z.string().min(1, 'El comentario no puede estar vacío').max(1000, 'El comentario es muy largo'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentInputProps {
    postId: string;
    parentId?: string | null;
    currentUser?: {
        id: string;
        name: string;
        imageUrl?: string;
        email?: string;
    };
    onCancel?: () => void;
    onSuccess?: () => void;
    autoFocus?: boolean;
    className?: string;
    initialValue?: string;
    onSubmit?: (content: string) => Promise<{ success: boolean; error?: string }>;
}

export function CommentInput({
    postId,
    parentId,
    currentUser,
    onCancel,
    onSuccess,
    onSubmit: externalSubmit,
    autoFocus = false,
    className,
    initialValue = ''
}: CommentInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            content: initialValue
        }
    });

    const contentValue = watch('content');
    const hasContent = contentValue?.trim().length > 0;

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const onSubmit = async (data: CommentFormData) => {
        if (!currentUser) {
            toast.error('Debes iniciar sesión para comentar');
            return;
        }

        setIsSubmitting(true);
        try {
            let result;

            // Allow external submit handler for editing
            if (externalSubmit) {
                result = await externalSubmit(data.content);
            } else {
                // Default legacy behavior: Create new comment
                result = await createComment({
                    postId,
                    parentId,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userImageUrl: currentUser.imageUrl,
                    email: currentUser.email,
                    content: data.content,
                });
            }

            if (result.success) {
                if (!initialValue) {
                    toast.success(parentId ? 'Respuesta enviada' : 'Comentario publicado');
                    reset();
                } else {
                    toast.success('Comentario actualizado');
                }
                setIsFocused(false);
                onSuccess?.();
            } else {
                toast.error(result.error || 'Error al procesar el comentario');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return (
            <div className={cn("p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground", className)}>
                Debes <button className="text-primary hover:underline font-medium">iniciar sesión</button> para dejar un comentario.
            </div>
        );
    }

    return (
        <div className={cn("flex gap-4 w-full", className)}>
            <Avatar className="w-10 h-10 border border-white/10 hidden sm:block">
                <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
                <AvatarFallback className="bg-primary/20 text-primary">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-2">
                <div className={cn(
                    "relative transition-all duration-300 rounded-xl overflow-hidden bg-zinc-900/50",
                    isFocused ? "ring-2 ring-primary/20 bg-zinc-900" : "hover:bg-zinc-900"
                )}>
                    <Textarea
                        {...register('content')}
                        ref={(e) => {
                            register('content').ref(e);
                            textareaRef.current = e;
                        }}
                        onFocus={() => setIsFocused(true)}
                        placeholder={parentId ? "Escribe una respuesta..." : "¿Qué opinas? Únete a la conversación..."}
                        className="min-h-[50px] max-h-[200px] w-full resize-none border-none bg-transparent focus-visible:ring-0 p-4 text-[15px] text-gray-200 placeholder:text-zinc-600"
                        rows={isFocused || hasContent ? 3 : 1}
                    />

                    {/* Focus indicator line at bottom if needed, using ring mainly instead */}
                </div>

                {(isFocused || hasContent) && (
                    <div className="flex justify-end gap-3 animate-in fade-in slide-in-from-top-1 duration-300 pt-1">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-full px-4 h-9"
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={!hasContent || isSubmitting}
                            className={cn(
                                "rounded-full px-6 font-semibold transition-all duration-300 h-9",
                                hasContent
                                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.5)] hover:bg-primary/90 hover:shadow-[0_0_20px_-3px_rgba(var(--primary-rgb),0.6)]"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed hover:bg-zinc-800"
                            )}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                                </div>
                            ) : (
                                externalSubmit ? 'Guardar' : (parentId ? 'Responder' : 'Publicar')
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
