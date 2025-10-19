'use client';

import { useState } from 'react';
import { Heart, Laugh, Frown, Angry, ThumbsUp, Zap } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface BlogReactionsProps {
  postId: string;
  reactions: Record<string, number>;
}

const reactionIcons = {
  crazy: Zap,
  surprise: Laugh,
  excited: Heart,
  hot: Frown,
  people: ThumbsUp,
  like: Heart,
  heart: Heart,
};

const reactionLabels = {
  crazy: 'Crazy',
  surprise: 'Sorpresa',
  excited: 'Emocionado',
  hot: 'Hot',
  people: 'Gente',
  like: 'Me gusta',
  heart: 'Corazón',
};

export function BlogReactions({ postId, reactions }: BlogReactionsProps) {
  const { user } = useAuth();
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReaction = async (reactionType: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement reaction submission
      console.log('Submitting reaction:', reactionType);
      setUserReaction(reactionType);
    } catch (error) {
      console.error('Error submitting reaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalReactions} reacciones
        </span>
      </div>

      {/* Reaction buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(reactionIcons).map(([type, Icon]) => {
          const count = reactions[type] || 0;
          const isSelected = userReaction === type;

          return (
            <Button
              key={type}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleReaction(type)}
              disabled={!user || isSubmitting}
              className="flex items-center gap-2 h-8"
            >
              <Icon className="h-3 w-3" />
              <span className="text-xs">{reactionLabels[type as keyof typeof reactionLabels]}</span>
              {count > 0 && (
                <span className="text-xs bg-muted px-1 rounded">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {!user && (
        <p className="text-xs text-muted-foreground">
          Inicia sesión para reaccionar a este artículo
        </p>
      )}
    </div>
  );
}