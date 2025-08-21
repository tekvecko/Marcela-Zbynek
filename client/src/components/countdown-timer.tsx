import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getWeddingCountdown } from "@/lib/wedding-utils";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = getWeddingCountdown();
      setCountdown(newCountdown);
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const openGoogleCalendar = () => {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svatba+Marcela+a+Zbyn%C4%9Bk&dates=20251011T120000Z/20251011T160000Z&details=Svatba+ve+Star%C3%A1+Po%C5%A1ta,+Kovalovice+109&location=Kovalovice+109,+%C4%8Cesk%C3%A1+republika";
    window.open(url, '_blank');
  };

  return (
    <section id="countdown" className="py-20 bg-white countdown-timer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Odpočet do svatby <span className="heart-decoration">❤️</span>
          </h2>
          <p className="text-lg text-charcoal/70">Každý den nás přibližuje k našemu velkému dni</p>
        </div>
        
        <div className="bg-gradient-to-r from-blush to-cream rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-romantic">{countdown.days}</div>
                <div className="text-charcoal/70 font-medium mt-2">Dní</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-gold">{countdown.hours}</div>
                <div className="text-charcoal/70 font-medium mt-2">Hodin</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-love">{countdown.minutes}</div>
                <div className="text-charcoal/70 font-medium mt-2">Minut</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-romantic">{countdown.seconds}</div>
                <div className="text-charcoal/70 font-medium mt-2">Sekund</div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <button 
              onClick={openGoogleCalendar}
              className="inline-flex items-center bg-gold text-white px-6 py-3 rounded-full font-medium hover:bg-gold/80 transition-colors shadow-lg"
            >
              <Calendar className="mr-2" size={20} />
              Přidat do kalendáře
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
