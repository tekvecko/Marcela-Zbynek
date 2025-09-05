import { useEffect, useState } from 'react';
import { useToast } from './use-toast';

interface NotificationData {
  id?: string;
  uploaderName?: string;
  likerName?: string;
  commenterName?: string;
  filename?: string;
  photoFilename?: string;
  questTitle?: string;
  content?: string;
  totalLikes?: number;
  timestamp: string;
}

export function useNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    // Socket.IO notifications temporarily disabled
    console.log('Notifications system ready (Socket.IO disabled)');
  }, []);

  return null;
}