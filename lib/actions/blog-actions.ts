'use server'

import { revalidatePath } from 'next/cache';
import {
    blogCommentsCollection,
    blogCollection,
    usersCollection
} from '@/lib/firebase/admin-collections';
import { BlogComment } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function createComment(data: {
    postId: string;
    content: string;
    userId: string;
    userName: string;
    userImageUrl?: string;
    email?: string;
    parentId?: string | null;
}) {
    try {
        // 1. Get user role for badge
        let authorRole: 'user' | 'admin' | 'moderator' = 'user';
        try {
            if (data.userId) {
                const userDoc = await usersCollection.get(data.userId);
                if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'moderator')) {
                    authorRole = userDoc.role;
                }
            }
        } catch (e) {
            console.error('Error fetching user role:', e);
        }

        // 2. Create comment object
        const newComment: Omit<BlogComment, 'id'> = {
            postId: data.postId,
            content: data.content,
            isApproved: true, // Auto-approve for now, change based on policy
            likes: 0,
            likedBy: [],
            userId: data.userId,
            userName: data.userName,
            userImageUrl: data.userImageUrl,
            email: data.email,
            createdAt: new Date(), // Admin SDK handles Date conversion or use Timestamps
            parentId: data.parentId || null,
            replyCount: 0,
            isPinned: false,
            authorRole
        };

        // 3. Save to Firestore
        const commentId = await blogCommentsCollection.create(newComment);

        // 4. Update reply count regarding parent (if reply)
        if (data.parentId) {
            await blogCommentsCollection.update(data.parentId, {
                replyCount: FieldValue.increment(1) as any
            });
        }

        revalidatePath(`/blog`);
        return { success: true, commentId };
    } catch (error) {
        console.error('Error creating comment:', error);
        return { success: false, error: 'Failed to create comment' };
    }
}

export async function getComments(postId: string, limitCount: number = 20, lastId?: string) {
    try {
        const conditions = [
            { field: 'postId', operator: '==' as const, value: postId }
        ];

        // Fetch a large enough batch
        const rawComments: BlogComment[] = await blogCommentsCollection.query(
            conditions,
            'createdAt',
            'desc',
            300
        ) as unknown as BlogComment[];

        // Filter for top-level comments
        let comments = rawComments.filter(c => !c.parentId);

        // Sort: Pinned first, then by createdAt desc
        comments.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const dateA = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt
                ? new Date((a.createdAt as any).seconds * 1000)
                : new Date(a.createdAt as any);
            const dateB = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt
                ? new Date((b.createdAt as any).seconds * 1000)
                : new Date(b.createdAt as any);
            return dateB.getTime() - dateA.getTime();
        });

        // Apply pagination
        let startIndex = 0;
        if (lastId) {
            const parsed = parseInt(lastId);
            if (!isNaN(parsed)) {
                startIndex = parsed;
            }
        }

        comments = comments.slice(startIndex, startIndex + limitCount);

        return { success: true, comments };
    } catch (error) {
        console.error('Error fetching comments:', error);
        return { success: false, error: 'Failed to fetch comments' };
    }
}

export async function getReplies(commentId: string) {
    try {
        const conditions = [
            { field: 'parentId', operator: '==' as const, value: commentId }
        ];
        // Fetch replies
        const replies = await blogCommentsCollection.query(conditions, 'createdAt', 'asc') as unknown as BlogComment[];

        return { success: true, replies };
    } catch (error: any) {
        console.error('[getReplies] Error fetching replies:', error);
        return { success: false, error: error.message || 'Failed to fetch replies' };
    }
}

export async function toggleLikeComment(commentId: string, userId: string) {
    try {
        const commentDoc = await blogCommentsCollection.get(commentId);
        if (!commentDoc) return { success: false, error: 'Comment not found' };

        const isLiked = commentDoc.likedBy?.includes(userId);

        if (isLiked) {
            await blogCommentsCollection.update(commentId, {
                likes: FieldValue.increment(-1) as any,
                likedBy: FieldValue.arrayRemove(userId) as any
            });
        } else {
            await blogCommentsCollection.update(commentId, {
                likes: FieldValue.increment(1) as any,
                likedBy: FieldValue.arrayUnion(userId) as any
            });
        }

        revalidatePath('/blog'); // Revalidate broadly
        return { success: true, isLiked: !isLiked };
    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, error: 'Failed to toggle like' };
    }
}

export async function pinComment(commentId: string, isPinned: boolean) {
    try {
        await blogCommentsCollection.update(commentId, { isPinned });
        revalidatePath('/blog');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to pin comment' };
    }
}

export async function deleteComment(commentId: string) {
    try {
        console.log(`[deleteComment] Deleting comment: ${commentId}`);
        // 1. Get the comment to check for parentId
        const commentDoc = await blogCommentsCollection.get(commentId);

        if (!commentDoc) {
            return { success: false, error: 'Comment not found' };
        }

        // 2. If it's a reply, decrement parent's replyCount
        if (commentDoc.parentId) {
            try {
                await blogCommentsCollection.update(commentDoc.parentId, {
                    replyCount: FieldValue.increment(-1) as any
                });
            } catch (err) {
                console.error('[deleteComment] Error decrementing reply count:', err);
            }
        }

        // 3. Delete the document
        await blogCommentsCollection.delete(commentId);

        revalidatePath('/blog');
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('[deleteComment] Error deleting comment:', error);
        return { success: false, error: error.message || 'Failed to delete comment' };
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        await blogCommentsCollection.update(commentId, { content });
        revalidatePath('/blog');
        return { success: true };
    } catch (error) {
        console.error('Error updating comment:', error);
        return { success: false, error: 'Failed to update comment' };
    }
}
