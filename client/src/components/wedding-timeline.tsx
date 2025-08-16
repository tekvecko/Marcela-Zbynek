import { useState, useEffect } from "react";
import { Clock, MapPin, Heart, Camera, Users, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import GlassButton from "@/components/ui/glass-button";

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  icon: any;
  isActive?: boolean;
  isCompleted?: boolean;
}

const timelineEvents: TimelineEvent[] = [
  {
    id: "arrival",
    time: "11:30",
    title: "Příchod hostů",
    description: "Vítejte a připravte se na překrásný den",
    location: "Hlavní vchod",
    icon: Users,
  },
  {
    id: "ceremony",
    time: "12:00",
    title: "Svatební obřad",
    description: "Ano, řekněme si to navždy",
    location: "Obřadní síň",
    icon: Heart,
  },
  {
    id: "photos",
    time: "12:30",
    title: "Focení",
    description: "Zachyťme tyto krásné okamžiky",
    location: "Zahrada",
    icon: Camera,
  },
  {
    id: "reception",
    time: "14:00",
    title: "Svatební hostina",
    description: "Společné oslavy a občerstvení",
    location: "Banketní sál",
    icon: Users,
  },
  {
    id: "party",
    time: "18:00",
    title: "Večerní oslava",
    description: "Tanec, hudba a zábava do rána",
    location: "Taneční sál",
    icon: Music,
  },
];

export default function WeddingTimeline() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentEvent, setCurrentEvent] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const weddingDate = new Date('2025-10-11');
    const now = new Date();
    
    // Only show live updates on wedding day
    if (weddingDate.toDateString() === now.toDateString()) {
      const currentTimeStr = now.toTimeString().substring(0, 5);
      
      const activeEvent = timelineEvents.find((event, index) => {
        const nextEvent = timelineEvents[index + 1];
        return currentTimeStr >= event.time && (!nextEvent || currentTimeStr < nextEvent.time);
      });
      
      setCurrentEvent(activeEvent?.id || null);
    }
  }, [currentTime]);

  const isEventCompleted = (eventTime: string) => {
    const weddingDate = new Date('2025-10-11');
    const now = new Date();
    
    if (weddingDate.toDateString() !== now.toDateString()) {
      return false;
    }
    
    const currentTimeStr = now.toTimeString().substring(0, 5);
    return currentTimeStr > eventTime;
  };

  const isEventActive = (eventId: string) => {
    return currentEvent === eventId;
  };

  return (
    <Card className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="text-white" size={24} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Program svatby
          </h2>
          <p className="text-charcoal/60 text-lg">
            11. října 2025 • Sledujte živé aktualizace během dne
          </p>
        </div>

        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const Icon = event.icon;
            const isCompleted = isEventCompleted(event.time);
            const isActive = isEventActive(event.id);
            
            return (
              <div
                key={event.id}
                className={`relative flex items-start gap-6 p-6 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-romantic/20 to-love/20 border-2 border-romantic/40 shadow-lg scale-102'
                    : isCompleted
                    ? 'bg-white/30 border border-green-200/50'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
              >
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-12 bg-gradient-to-b from-romantic/40 to-transparent" />
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-romantic to-love animate-pulse'
                    : isCompleted
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                }`}>
                  <Icon className="text-white" size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`font-mono text-lg font-bold ${
                      isActive ? 'text-romantic' : 'text-charcoal'
                    }`}>
                      {event.time}
                    </span>
                    {isActive && (
                      <span className="bg-romantic text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        PRÁVĚ TEĎ
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        DOKONČENO
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-charcoal/70 mb-3">
                    {event.description}
                  </p>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-charcoal/60">
                      <MapPin size={16} />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Action button for current event */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <GlassButton variant="primary" size="sm">
                      <Camera size={16} />
                      Fotit teď
                    </GlassButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live status */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            currentEvent 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              currentEvent ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {currentEvent ? 'Živé aktualizace aktivní' : 'Čekáme na svatební den'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}