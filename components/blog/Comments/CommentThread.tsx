'use client';

import { useState } from 'react';
import { BlogComment } from '@/lib/types';
import { CommentCard } from './CommentCard';
import { getReplies } from '@/lib/actions/blog-actions';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentThreadProps {
    comment: BlogComment;
    postId: string;
    currentUser?: any;
    onDelete?: (commentId: string) => void;
}

export function CommentThread({ comment, postId, currentUser, onDelete }: CommentThreadProps) {
    const [replies, setReplies] = useState<BlogComment[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [areRepliesVisible, setAreRepliesVisible] = useState(false);
    const [hasLoadedReplies, setHasLoadedReplies] = useState(false);

    // Use state for reply count to update it instantly after a reply
    const [currentReplyCount, setCurrentReplyCount] = useState(comment.replyCount || 0);

    const loadReplies = async () => {
        // If replies were already loaded, just toggle visibility
        if (hasLoadedReplies && !areRepliesVisible) {
            setAreRepliesVisible(true);
            return;
        }

        // If shown, hide them
        if (areRepliesVisible && hasLoadedReplies) {
            setAreRepliesVisible(false);
            return;
        }

        setIsLoadingReplies(true);
        try {
            const result = await getReplies(comment.id);
            if (result.success && result.replies) {
                setReplies(result.replies);
                setHasLoadedReplies(true);
                setAreRepliesVisible(true);
            }
        } catch (error) {
            console.error('Error loading replies', error);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleReplySuccess = () => {
        // 1. Increment count
        setCurrentReplyCount(prev => prev + 1);

        // 2. Load newly created reply immediately
        setHasLoadedReplies(false);
        setIsLoadingReplies(true);
        getReplies(comment.id).then(result => {
            if (result.success && result.replies) {
                setReplies(result.replies);
                setHasLoadedReplies(true);
                setAreRepliesVisible(true); // Auto expand
            }
            setIsLoadingReplies(false);
        });
    };

    const handleDeleteReply = (replyId: string) => {
        setReplies(prev => prev.filter(r => r.id !== replyId));
        setCurrentReplyCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="flex flex-col">
            <CommentCard
                comment={comment}
                postId={postId}
                currentUser={currentUser}
                onReply={handleReplySuccess}
                onDelete={onDelete}
            />

            {/* Replies Section */}
            <div className="relative ml-6 sm:ml-8 pl-6 sm:pl-8 border-l-2 border-white/5 hover:border-white/10 transition-colors duration-200 space-y-4">
                {/* Toggle Replies Button */}
                {(currentReplyCount > 0 || replies.length > 0) && (
                    <div className="relative">
                        {/* Visual connector line extension */}
                        <div className="absolute -left-6 top-1/2 w-4 h-[2px] bg-white/5" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                loadReplies();
                            }}
                            className="h-8 text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/5 mb-2 transition-colors z-10"
                        >
                            {isLoadingReplies ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {areRepliesVisible ? (
                                        <>Ocultar {currentReplyCount === 1 ? 'respuesta' : `(${currentReplyCount}) respuestas`}</>
                                    ) : (
                                        <>Ver {currentReplyCount === 1 ? 'respuesta' : `${currentReplyCount} respuestas`}</>
                                    )}
                                </span>
                            )}
                        </Button>
                    </div>
                )}

                {/* Render Replies */}
                {areRepliesVisible && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {replies.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                currentUser={currentUser}
                                onDelete={handleDeleteReply}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
