
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Připojit se k WebSocket serveru
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    // Naslouchání událostem
    newSocket.on('photo-uploaded', (data: NotificationData) => {
      toast({
        title: "📸 Nová fotka!",
        description: `${data.uploaderName} přidal${data.uploaderName?.endsWith('a') ? 'a' : ''} novou fotku${data.questTitle ? ` do výzvy "${data.questTitle}"` : ''}`,
        duration: 5000,
      });
    });

    newSocket.on('photo-liked', (data: NotificationData) => {
      toast({
        title: "❤️ Nový lajk!",
        description: `${data.likerName} dal${data.likerName?.endsWith('a') ? 'a' : ''} lajk fotce (celkem ${data.totalLikes})`,
        duration: 3000,
      });
    });

    newSocket.on('comment-added', (data: NotificationData) => {
      toast({
        title: "💬 Nový komentář!",
        description: `${data.commenterName}: "${data.content?.substring(0, 50)}${(data.content?.length || 0) > 50 ? '...' : ''}"`,
        duration: 4000,
      });
    });

    newSocket.on('connect', () => {
      console.log('🔗 Připojen k notifikačnímu serveru');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Odpojen od notifikačního serveru');
    });

    // Cleanup při unmount
    return () => {
      newSocket.close();
    };
  }, [toast]);

  return socket;
}
