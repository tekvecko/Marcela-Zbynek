
import { Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function MusicSection() {
  return (
    <section id="music" className="py-20 bg-gradient-to-br from-sage via-cream to-romantic">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Hudba a zábava <span className="heart-decoration">🎵</span>
          </h2>
          <p className="text-lg text-charcoal/70 max-w-3xl mx-auto mb-8">
            Hudební doprovod pro nezapomenutelné okamžiky
          </p>
        </motion.div>

        {/* Hudba */}
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
                  <Music className="text-romantic" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal">Hudební program</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Program</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Obřad</p>
                      <p className="text-charcoal/70 text-sm">Klasická hudba a svatební písně</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Hostina</p>
                      <p className="text-charcoal/70 text-sm">Jemná background music</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Večerní zábava</p>
                      <p className="text-charcoal/70 text-sm">DJ mix - hity všech generací</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Hudební přání</h4>
                  <p className="text-charcoal/70 mb-4">
                    Máte oblíbenou písničku, při které se radi bavíte? 
                    Napište nám ji do komentáře na svatební fotografii v galerii!
                  </p>
                  
                  <div className="p-4 bg-white/30 rounded-lg">
                    <p className="text-charcoal/70 text-sm italic">
                      "Hudba spojuje srdce a vytváří nezapomenutelné okamžiky. 
                      Těšíme se, až si s vámi zatancujeme!"
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
