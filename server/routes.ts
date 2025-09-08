import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import {
  insertUserSchema,
  insertChallengeSchema,
  insertSubmissionSchema,
  insertAchievementSchema,
  insertUserStatsSchema,
} from '../shared/schema';

const router = Router();

// Mock user for development - in production, use proper auth
const MOCK_USER_ID = 1;

// Initialize mock user if not exists
async function ensureMockUser() {
  const user = await storage.getUser(MOCK_USER_ID);
  if (!user) {
    await storage.createUser({
      email: 'demo@photoquest.com',
      name: 'Demo User',
      avatar: null,
    });
  }
}

// Users
router.get('/api/users/me', async (req, res) => {
  await ensureMockUser();
  const user = await storage.getUserWithProgress(MOCK_USER_ID);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.post('/api/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid user data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Challenges
router.get('/api/challenges', async (req, res) => {
  await ensureMockUser();
  try {
    const challenges = await storage.getChallengesWithSubmissions(MOCK_USER_ID);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

router.post('/api/challenges', async (req, res) => {
  try {
    const challengeData = insertChallengeSchema.parse(req.body);
    const challenge = await storage.createChallenge(challengeData);
    res.status(201).json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid challenge data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Submissions
router.post('/api/submissions', async (req, res) => {
  await ensureMockUser();
  try {
    const submissionData = {
      ...insertSubmissionSchema.parse(req.body),
      userId: MOCK_USER_ID,
    };

    // Validate challenge exists and is active
    const challenge = await storage.getActiveChallenge(submissionData.challengeId);
    if (!challenge) {
      return res.status(400).json({ error: 'Challenge not found or inactive' });
    }

    const submission = await storage.createSubmission(submissionData);

    // Auto-approve for demo (in production, you'd have manual review)
    const approvedSubmission = await storage.approveSubmission(submission.id, challenge.points);

    // Update user stats
    const currentWeek = getCurrentWeek();
    await storage.updateUserStats({
      userId: MOCK_USER_ID,
      week: currentWeek,
      photosSubmitted: 1,
      challengesJoined: 0,
      pointsEarned: challenge.points,
      rankChange: 0,
    });

    // Check for achievements
    await checkAndAwardAchievements(MOCK_USER_ID);

    res.status(201).json(approvedSubmission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid submission data', details: error.errors });
    }
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

router.get('/api/submissions/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const submissions = await storage.getUserSubmissions(userId);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Achievements
router.get('/api/achievements/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const achievements = await storage.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Leaderboard
router.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await storage.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// User stats
router.get('/api/stats/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const week = req.query.week as string;
    const stats = await storage.getUserStats(userId, week);
    res.json(stats || {
      userId,
      week: week || getCurrentWeek(),
      photosSubmitted: 0,
      challengesJoined: 0,
      pointsEarned: 0,
      rankChange: 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Utility functions
function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-${week.toString().padStart(2, '0')}`;
}

async function checkAndAwardAchievements(userId: number) {
  const submissions = await storage.getUserSubmissions(userId);
  const achievements = await storage.getUserAchievements(userId);
  
  // First submission achievement
  if (submissions.length === 1 && !achievements.some(a => a.type === 'first_submission')) {
    await storage.createAchievement({
      userId,
      type: 'first_submission',
      title: 'First Submission',
      points: 100,
      icon: 'fas fa-camera',
    });
  }

  // Streak achievements (simplified - would need more complex logic in production)
  if (submissions.length >= 3 && !achievements.some(a => a.type === 'streak')) {
    await storage.createAchievement({
      userId,
      type: 'streak',
      title: '3-Day Streak',
      points: 150,
      icon: 'fas fa-fire',
    });
  }
}

export { router };
