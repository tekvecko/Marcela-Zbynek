import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes';
import { storage } from './storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// API routes
app.use(router);

// Initialize default challenges
async function initializeDefaultChallenges() {
  try {
    const existingChallenges = await storage.getChallenges();
    if (existingChallenges.length === 0) {
      console.log('Initializing default challenges...');
      
      const defaultChallenges = [
        {
          title: 'Golden Hour Magic',
          description: 'Capture the perfect golden hour shot showcasing dramatic lighting and warm tones. Focus on the interplay between light and shadow.',
          points: 500,
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300',
          daysLeft: 3,
          participants: 234,
          submissions: 89,
        },
        {
          title: 'Urban Stories',
          description: 'Document life in the city through candid street photography. Capture authentic moments and human connections in urban environments.',
          points: 750,
          imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300',
          daysLeft: 7,
          participants: 156,
          submissions: 67,
        },
        {
          title: 'Macro Wonders',
          description: 'Explore the tiny world through macro photography. Discover intricate details and patterns in nature\'s smallest subjects.',
          points: 300,
          imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300',
          daysLeft: 5,
          participants: 98,
          submissions: 43,
        },
      ];

      for (const challenge of defaultChallenges) {
        await storage.createChallenge(challenge);
      }

      console.log('Default challenges initialized successfully!');
    }
  } catch (error) {
    console.error('Failed to initialize default challenges:', error);
  }
}

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDefaultChallenges();
});
