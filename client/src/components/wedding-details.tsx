import { Calendar, MapPin, Clock, Copy, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function WeddingDetails() {
  const { toast } = useToast();

  const openGoogleCalendar = () => {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svatba+Marcela+a+Zbyn%C4%9Bk&dates=20251011T120000Z/20251011T160000Z&details=Svatba+ve+Star%C3%A1+Po%C5%A1ta,+Kovalovice+109&location=Kovalovice+109,+%C4%8Cesk%C3%A1+republika";
    window.open(url, '_blank');
  };

  const openAppleCalendar = () => {
    const url = "data:text/calendar;charset=utf8,BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:20251011T120000Z\nDTEND:20251011T160000Z\nSUMMARY:Svatba Marcela a Zbyněk\nDESCRIPTION:Svatba ve Stará Pošta, Kovalovice 109\nLOCATION:Kovalovice 109, Česká republika\nEND:VEVENT\nEND:VCALENDAR";
    const blob = new Blob([url.replace(/data:text\/calendar;charset=utf8,/, '')], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'svatba-marcela-zbynek.ics';
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Zkopírováno!",
      description: "Text byl zkopírován do schránky",
    });
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Svatba Marcela a Zbyněk',
        text: 'Pozvánka na svatbu Marcely a Zbyňka - 11. října 2025',
        url: window.location.href,
      });
    } else {
      copyToClipboard(window.location.href);
    }
  };

  return (
    <section id="ceremony" className="py-20 bg-gradient-to-br from-cream via-blush to-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Svatební obřad <span className="heart-decoration">💒</span>
          </h2>
          <p className="text-lg text-charcoal/70 max-w-3xl mx-auto mb-8">
            Začátek našeho společného příběhu
          </p>
        </motion.div>

        {/* Obřad */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-romantic/20 rounded-full">
                  <Calendar className="text-romantic" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal">Datum, čas a místo</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gold" size={20} />
                    <div>
                      <p className="font-semibold text-charcoal">Datum</p>
                      <p className="text-charcoal/70">Sobota, 11. října 2025</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="text-gold" size={20} />
                    <div>
                      <p className="font-semibold text-charcoal">Čas</p>
                      <p className="text-charcoal/70">12:00 - začátek obřadu</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="text-gold" size={20} />
                    <div>
                      <p className="font-semibold text-charcoal">Místo</p>
                      <p className="text-charcoal/70">Stará Pošta, Kovalovice 109</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Input 
                        value="Kovalovice 109, 664 07 Kovalovice" 
                        readOnly 
                        className="bg-white/50"
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("Kovalovice 109, 664 07 Kovalovice")}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-charcoal mb-3">Přidat do kalendáře</h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={openGoogleCalendar}
                      className="w-full bg-romantic hover:bg-romantic/90 text-white"
                    >
                      <Calendar className="mr-2" size={16} />
                      Google Calendar
                    </Button>

                    <Button 
                      onClick={openAppleCalendar}
                      variant="outline"
                      className="w-full border-romantic text-romantic hover:bg-romantic/10"
                    >
                      <Calendar className="mr-2" size={16} />
                      Apple Calendar
                    </Button>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-charcoal mb-3">Navigace</h4>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-gold hover:bg-gold/90 text-white"
                        onClick={() => window.open('https://mapy.cz/s/2bCb8', '_blank')}
                      >
                        <MapPin className="mr-2" size={16} />
                        Mapy.cz
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full border-gold text-gold hover:bg-gold/10"
                        onClick={() => window.open('https://maps.google.com/?q=Kovalovice+109', '_blank')}
                      >
                        <MapPin className="mr-2" size={16} />
                        Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sdílení */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-romantic/10 to-love/10 rounded-3xl shadow-lg border border-romantic/20 max-w-md mx-auto">
            <CardContent className="p-6">
              <h4 className="font-semibold text-charcoal mb-4">Sdílet detaily</h4>
              <Button 
                onClick={shareEvent}
                className="bg-romantic hover:bg-romantic/90 text-white"
              >
                <Share2 className="mr-2" size={16} />
                Sdílet s přáteli
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}