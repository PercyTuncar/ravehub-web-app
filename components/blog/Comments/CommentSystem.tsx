'use client';

import { useState } from 'react';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { Separator } from '@/components/ui/separator';
import { BlogComment } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';

interface CommentSystemProps {
    postId: string;
    initialComments?: BlogComment[];
    totalComments?: number;
    currentUser?: {
        id: string;
        name: string;
        imageUrl?: string;
        email?: string;
    };
}

export function CommentSystem({ postId, initialComments = [], totalComments = 0, currentUser: initialCurrentUser }: CommentSystemProps) {
    const { user } = useAuth();

    // Construct currentUser from AuthContext if not provided via props (which it isn't in Server Components)
    const currentUser = initialCurrentUser || (user ? {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Usuario Ravehub',
        imageUrl: user.photoURL,
        email: user.email,
        role: user.role
    } : undefined);

    // Use state to update the list when a new comment is posted successfully
    const [comments, setComments] = useState<BlogComment[]>(initialComments);
    const [count, setCount] = useState(totalComments);

    const handleCommentSuccess = () => {
        // Ideally we would fetch the new comment or append it optimistically.
        // Since createComment revalidates the path, the page might reload or we should just reload data.
        // For a "State-of-the-Art" feel, we should append it to the list locally.
        // However, we don't return the full comment object from createComment (just id).
        // Let's rely on revalidation or a simple reload for now, OR fetch the new comment.
        // TODO: Improve this to append immediately.

        // Simple improvement: Increment count
        setCount(prev => prev + 1);

        // In a real infinite scroll app, we might want to prepend the new comment or refresh the list.
        // For simplicity, we can reload the page or trigger a refresh in CommentList.
        // Let's trigger a refresh by key change or similar if we want to be fancy, but simple router.refresh() is easiest but full page.
        window.location.reload();
    };

    return (
        <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    Comentarios
                    <span className="text-gray-500 text-lg font-normal">({count})</span>
                </h3>
            </div>

            <div className="mb-10">
                <CommentInput
                    postId={postId}
                    currentUser={currentUser}
                    onSuccess={handleCommentSuccess}
                />
            </div>

            <CommentList
                postId={postId}
                currentUser={currentUser}
                initialComments={comments}
            />
        </div>
    );
}
