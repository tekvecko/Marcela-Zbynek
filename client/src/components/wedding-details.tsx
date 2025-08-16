import { Calendar, MapPin, Clock, Utensils, Music, Copy, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function WeddingDetails() {
  const { weddingToast } = useToast();

  const openGoogleCalendar = () => {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svatba+Marcela+a+Zbyn%C4%9Bk&dates=20251011T100000Z/20251011T160000Z&details=Svatba+ve+Star%C3%A1+Po%C5%A1ta,+Kovalovice+109&location=Kovalovice+109,+%C4%8Cesk%C3%A1+republika";
    window.open(url, '_blank');
  };

  const openAppleCalendar = () => {
    // Apple Calendar uses a different format
    const url = "data:text/calendar;charset=utf8,BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:20251011T100000Z\nDTEND:20251011T160000Z\nSUMMARY:Svatba Marcela a Zbyněk\nDESCRIPTION:Svatba ve Stará Pošta, Kovalovice 109\nLOCATION:Kovalovice 109, Česká republika\nEND:VEVENT\nEND:VCALENDAR";
    const blob = new Blob([url.replace(/data:text\/calendar;charset=utf8,/, '')], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'svatba-marcela-zbynek.ics';
    link.click();
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const text = "Pozvánka na svatbu Marcely a Zbyňka! 💕";
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Odkaz zkopírován!",
        description: "Odkaz na svatební web byl zkopírován do schránky.",
      });
    } catch {
      toast({
        title: "Chyba při kopírování",
        description: "Nepodařilo se zkopírovat odkaz.",
        variant: "destructive",
      });
    }
  };

  const openMap = () => {
    const query = encodeURIComponent("Kovalovice 109, Česká republika");
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  return (
    <section id="details" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Kde se vezmeme? <span className="heart-decoration">💒</span>
          </h2>
          <p className="text-lg text-charcoal/70">Všechny důležité informace o našem velkém dni</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Location Info */}
          <Card className="bg-gradient-to-br from-blush to-cream rounded-3xl shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-romantic rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-2">Místo konání</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Calendar className="text-romantic mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-charcoal">Obřad</p>
                    <p className="text-charcoal/70">Kovalovice 109</p>
                    <p className="text-charcoal/70">Česká republika</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="text-gold mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-charcoal">Čas</p>
                    <p className="text-charcoal/70">11. října 2025</p>
                    <p className="text-charcoal/70">10:00 - 16:00</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Utensils className="text-love mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-charcoal">Hostina</p>
                    <p className="text-charcoal/70">Následuje po obřadu</p>
                    <p className="text-charcoal/70">Ve stejném místě</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={openMap}
                className="w-full bg-romantic text-white hover:bg-love mt-6"
              >
                <MapPin className="mr-2" size={16} />
                Navigovat
              </Button>
            </CardContent>
          </Card>
          
          {/* Calendar & Social Sharing */}
          <Card className="bg-gradient-to-br from-cream to-gold/20 rounded-3xl shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="text-white" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal mb-2">Sdílejte s námi</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Přidat do kalendáře</h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={openGoogleCalendar}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Calendar className="mr-2" size={16} />
                      Google Kalendář
                    </Button>
                    <Button 
                      onClick={openAppleCalendar}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Calendar className="mr-2" size={16} />
                      Apple Kalendář
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Sdílet svatební web</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button 
                      onClick={shareOnFacebook}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Facebook
                    </Button>
                    <Button 
                      onClick={shareOnWhatsApp}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      WhatsApp
                    </Button>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-charcoal/70 mb-2">Nebo zkopírujte odkaz:</p>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={window.location.href}
                        readOnly 
                        className="flex-1 bg-blush border-0 text-sm text-charcoal"
                      />
                      <Button 
                        onClick={copyLink}
                        size="sm"
                        className="bg-romantic text-white hover:bg-love"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spotify Playlist Section */}
        <Card className="bg-white rounded-3xl shadow-xl mt-12 max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
                Náš svatební playlist <span className="heart-decoration">🎵</span>
              </h3>
              <p className="text-charcoal/70">Hudba, která doprovází náš velký den</p>
            </div>
            
            {/* Spotify Embed */}
            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-8 text-white text-center">
              <Music size={48} className="mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">Spotify Playlist</h4>
              <p className="mb-4">playlist - obřad - Marcela a Zbyněk</p>
              <div className="bg-white/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-left">
                  <div>
                    <p className="font-semibold">Feel Love - Nitelite Edit</p>
                    <p className="text-sm opacity-80">Darren Styles</p>
                  </div>
                  <span className="text-sm">04:09</span>
                </div>
              </div>
              <Button 
                onClick={() => window.open('https://open.spotify.com/playlist/6RzgRLBxtDY5vqvyj5Li6X', '_blank')}
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                <Music className="mr-2" size={16} />
                Poslouchat na Spotify
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
