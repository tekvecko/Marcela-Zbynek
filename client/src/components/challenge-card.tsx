import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Users, Upload, Clock, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PhotoSubmissionModal from './photo-submission-modal';
import type { ChallengeWithSubmissions } from '../../../shared/schema';

interface ChallengeCardProps {
  challenge: ChallengeWithSubmissions;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitPhotoMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Photo submitted successfully!",
        description: `You earned ${challenge.points} points for this submission.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitPhoto = (data: any) => {
    submitPhotoMutation.mutate({
      ...data,
      challengeId: challenge.id,
    });
  };

  return (
    <>
      <Card className="overflow-hidden hover:border-primary/50 transition-colors" data-testid={`challenge-card-${challenge.id}`}>
        <div className="relative">
          <img 
            src={challenge.imageUrl} 
            alt={challenge.title}
            className="w-full h-48 object-cover"
            data-testid="challenge-image"
          />
          <div className="absolute top-4 right-4">
            <Badge variant="default" className="bg-accent text-accent-foreground">
              <Trophy className="w-3 h-3 mr-1" />
              {challenge.points} pts
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Clock className="w-3 h-3 mr-1" />
              {challenge.daysLeft} days left
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-2" data-testid="challenge-title">
            {challenge.title}
          </h3>
          <p className="text-muted-foreground mb-4" data-testid="challenge-description">
            {challenge.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span data-testid="challenge-participants">{challenge.participants}</span> participants
              </span>
              <span className="flex items-center">
                <Camera className="w-4 h-4 mr-1" />
                <span data-testid="challenge-submissions">{challenge.submissions}</span> submissions
              </span>
            </div>
            
            {challenge.hasSubmitted ? (
              <Badge variant="outline" className="text-accent border-accent">
                <Upload className="w-3 h-3 mr-1" />
                Submitted
              </Badge>
            ) : (
              <Button 
                onClick={() => setIsModalOpen(true)}
                disabled={submitPhotoMutation.isPending}
                data-testid="submit-photo-button"
              >
                <Camera className="w-4 h-4 mr-2" />
                Submit Photo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PhotoSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challenge={challenge}
        onSubmit={handleSubmitPhoto}
        isSubmitting={submitPhotoMutation.isPending}
      />
    </>
  );
}
