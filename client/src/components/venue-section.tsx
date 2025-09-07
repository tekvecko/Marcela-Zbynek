
import { MapPin, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function VenueSection() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Zkopírováno!",
      description: "Text byl zkopírován do schránky",
    });
  };

  return (
    <section id="venue" className="py-20 bg-gradient-to-br from-cream via-blush to-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Místo konání <span className="heart-decoration">🏛️</span>
          </h2>
          <p className="text-lg text-charcoal/70 max-w-3xl mx-auto mb-8">
            Historická budova v srdci Kovalovic, která poskytuje romantickou atmosféru 
            pro náš velký den
          </p>
        </motion.div>

        {/* Místo konání */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gold/20 rounded-full">
                  <MapPin className="text-gold" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal">Stará Pošta</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">O místě</h4>
                    <p className="text-charcoal/70 mb-4">
                      Historická budova v srdci Kovalovic, která poskytuje romantickou atmosféru 
                      pro náš velký den. Krásné prostory s venkovní zahradou.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Adresa</h4>
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
                  <div>
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

                  <div>
                    <h4 className="font-semibold text-charcoal mb-2">Parkování</h4>
                    <p className="text-charcoal/70 text-sm">
                      K dispozici je parkoviště přímo u objektu. 
                      Doporučujeme příjezd 15 minut před začátkem obřadu.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
