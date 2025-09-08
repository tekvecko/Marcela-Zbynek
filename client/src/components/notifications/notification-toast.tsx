import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Notification {
  id: string;
  type: 'achievement' | 'level' | 'points';
  title: string;
  description: string;
  icon: string;
  show: boolean;
}

export function NotificationToast() {
  const { lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (lastMessage) {
      let notification: Notification | null = null;

      switch (lastMessage.type) {
        case 'achievement_unlocked':
          notification = {
            id: Date.now().toString(),
            type: 'achievement',
            title: 'Nový Achievement!',
            description: `Odemkl jsi "${lastMessage.data.title}"`,
            icon: 'fas fa-trophy',
            show: true,
          };
          break;
        case 'level_up':
          notification = {
            id: Date.now().toString(),
            type: 'level',
            title: 'Level Up!',
            description: `Dosáhl jsi Level ${lastMessage.data.newLevel}`,
            icon: 'fas fa-arrow-up',
            show: true,
          };
          break;
        case 'points_earned':
          notification = {
            id: Date.now().toString(),
            type: 'points',
            title: 'Body získány!',
            description: `+${lastMessage.data.points} XP`,
            icon: 'fas fa-star',
            show: true,
          };
          break;
      }

      if (notification) {
        setNotifications(prev => [...prev, notification]);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, show: false } : n)
          );
          
          // Remove from array after fade out
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 300);
        }, 5000);
      }
    }
  }, [lastMessage]);

  const hideNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, show: false } : n)
    );
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`bg-card border border-primary rounded-lg p-4 shadow-lg max-w-sm transition-all duration-300 ${
            notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
          data-testid={`toast-${notification.type}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <i className={`${notification.icon} text-primary-foreground`}></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm text-muted-foreground">{notification.description}</p>
            </div>
            <button 
              onClick={() => hideNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground"
              data-testid={`button-close-toast-${notification.id}`}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="w-full bg-muted rounded-full h-1 mt-3">
            <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
