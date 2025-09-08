import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CloudUpload, X, Upload } from 'lucide-react';
import type { Challenge } from '../../../shared/schema';

const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  camera: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().min(1, 'Image is required'),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

interface PhotoSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  onSubmit: (data: SubmissionForm) => void;
  isSubmitting: boolean;
}

export default function PhotoSubmissionModal({
  isOpen,
  onClose,
  challenge,
  onSubmit,
  isSubmitting,
}: PhotoSubmissionModalProps) {
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: '',
      description: '',
      camera: '',
      location: '',
      imageUrl: '',
    },
  });

  const handleSubmit = (data: SubmissionForm) => {
    onSubmit(data);
  };

  const handleFileUpload = (file: File) => {
    // In a real app, you'd upload to a service like Cloudinary or AWS S3
    // For demo purposes, we'll use a placeholder URL
    const demoImageUrl = `https://images.unsplash.com/photo-1566564965-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600`;
    form.setValue('imageUrl', demoImageUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0] && files[0].type.startsWith('image/')) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="photo-submission-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Submit Your Photo
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="close-modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Challenge Info */}
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-semibold mb-1" data-testid="selected-challenge">
                {challenge.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
              <div className="mt-2 text-sm font-medium text-accent">
                Reward: {challenge.points} points
              </div>
            </div>

            {/* Photo Upload */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Photo</FormLabel>
                  <FormControl>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        dragOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-upload')?.click()}
                      data-testid="file-upload-area"
                    >
                      {field.value ? (
                        <div className="space-y-2">
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="max-h-32 mx-auto rounded"
                          />
                          <p className="text-sm text-muted-foreground">
                            Image uploaded successfully
                          </p>
                        </div>
                      ) : (
                        <>
                          <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG up to 10MB
                          </p>
                        </>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="file-input"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a captivating title..." 
                      {...field}
                      data-testid="photo-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell the story behind your photo..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="photo-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Camera and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="camera"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera/Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Canon 5D Mark IV"
                        {...field}
                        data-testid="camera-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Central Park, NYC"
                        {...field}
                        data-testid="location-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Photo
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
