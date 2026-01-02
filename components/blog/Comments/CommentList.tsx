'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getComments } from '@/lib/actions/blog-actions';
import { BlogComment } from '@/lib/types';
import { CommentThread } from './CommentThread';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Loader2 } from 'lucide-react';

interface CommentListProps {
    postId: string;
    currentUser?: any;
    initialComments?: BlogComment[];
}

export function CommentList({ postId, currentUser, initialComments = [] }: CommentListProps) {
    const [comments, setComments] = useState<BlogComment[]>(initialComments);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastId, setLastId] = useState<string | undefined>(undefined);

    // Custom infinite scroll trigger since we might not have 'react-intersection-observer' installed
    const observerTarget = useRef<HTMLDivElement>(null);

    const loadMoreComments = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            // Use current length as offset
            const offset = comments.length;
            const limit = 10;

            // Pass offset as string to match current signature of getComments (which expects string | undefined)
            // We modified getComments to parse this string as an integer offset.
            const result = await getComments(postId, limit, offset.toString());

            if (result.success && result.comments && result.comments.length > 0) {
                setComments(prev => {
                    // Deduplicate by ID to be perfectly safe
                    const existingIds = new Set(prev.map(c => c.id));
                    const newUniqueAndValid = result.comments!.filter(c => !existingIds.has(c.id));

                    if (newUniqueAndValid.length === 0) {
                        // If we got comments but all were duplicates, we are done
                        setHasMore(false);
                        return prev;
                    }

                    return [...prev, ...newUniqueAndValid];
                });

                // If we received fewer items than requested, we reached the end
                if (result.comments.length < limit) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more comments", error);
            setHasMore(false); // Stop on error to prevent loops
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, comments.length, postId]);

    // Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreComments();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadMoreComments]);

    // Initial load if no initialComments passed (client side mostly)
    useEffect(() => {
        if (initialComments.length === 0) {
            loadMoreComments();
        }
    }, [initialComments.length, loadMoreComments]);

    // ...

    const handleDeleteComment = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        currentUser={currentUser}
                        onDelete={handleDeleteComment}
                    />
                ))}
            </div>

            {/* Loading State / Trigger */}
            <div ref={observerTarget} className="py-2">
                {loading && (
                    <div className="space-y-6 animate-pulse">
                        {/* Custom Skeleton as requested: 'bloques grises parpadeantes' */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-zinc-800/80" /> {/* Avatar */}
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="flex gap-3 items-center">
                                        <div className="h-4 w-32 bg-zinc-800/80 rounded" />   {/* Name */}
                                        <div className="h-3 w-20 bg-zinc-800/50 rounded" />    {/* Time */}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-zinc-800/60 rounded" />  {/* Line 1 */}
                                        <div className="h-4 w-5/6 bg-zinc-800/60 rounded" />   {/* Line 2 */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!hasMore && comments.length > 0 && (
                    <div className="py-8 text-center">
                        <p className="text-zinc-600 text-sm font-medium">Has llegado al final de los comentarios.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
