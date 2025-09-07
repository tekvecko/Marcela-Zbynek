
import { Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function MenuSection() {
  return (
    <section id="menu" className="py-20 bg-gradient-to-br from-blush via-cream to-sage">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Občerstvení <span className="heart-decoration">🍽️</span>
          </h2>
          <p className="text-lg text-charcoal/70 max-w-3xl mx-auto mb-8">
            Lahodné pokrmy a nápoje pro náš slavnostní den
          </p>
        </motion.div>

        {/* Občerstvení */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-sage/20 rounded-full">
                  <Utensils className="text-sage" size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold text-charcoal">Svatební menu</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Hlavní menu</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Předkrm</p>
                      <p className="text-charcoal/70 text-sm">Carpaccio z hovězího s parmazánem</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Hlavní chod</p>
                      <p className="text-charcoal/70 text-sm">Pečená kachna s červeným zelím a knedlíky</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Dezert</p>
                      <p className="text-charcoal/70 text-sm">Svatební dort a zmrzlinový pohár</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-charcoal mb-4">Nápoje a další</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Aperitiv</p>
                      <p className="text-charcoal/70 text-sm">Prosecco, víno, nealko</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">K hostině</p>
                      <p className="text-charcoal/70 text-sm">Moravská vína, pivo, nealko nápoje</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-lg">
                      <p className="font-medium text-charcoal">Vegetariánská varianta</p>
                      <p className="text-charcoal/70 text-sm">Dostupná na požádání</p>
                    </div>
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
