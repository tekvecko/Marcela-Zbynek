import { Heart, Calendar, MapPin, Star, Camera, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StoryMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  location?: string;
  icon: any;
  image?: string;
  highlight?: boolean;
}

const storyMilestones: StoryMilestone[] = [
  {
    id: "meeting",
    year: "2019",
    title: "První setkání",
    description: "Poznali jsme se na společné oslavě přátel. Zbyněk byl ten, kdo se první osmělil a přišel si s Marcelou promluvit. Od prvního rozhovoru bylo jasné, že mezi námi něco je.",
    location: "Praha",
    icon: Heart,
    highlight: true
  },
  {
    id: "first-date",
    year: "2019",
    title: "První rande",
    description: "Naše první oficální rande proběhlo v útulné kavárně v centru Prahy. Povídali jsme si hodiny a ani jsme si nevšimli, jak rychle čas utíká. Věděli jsme, že tohle je začátek něčeho krásného.",
    location: "Kavárna Louvre, Praha",
    icon: Star
  },
  {
    id: "relationship",
    year: "2020",
    title: "Začátek vztahu",
    description: "Po několika měsících randění jsme se rozhodli, že chceme být spolu oficiálně. I přes těžké období pandemie jsme zjistili, že spolu dokážeme překonat cokoliv.",
    icon: Heart
  },
  {
    id: "moving",
    year: "2021",
    title: "Společné bydlení",
    description: "Udělali jsme velký krok a začali bydlet spolu. Náš první společný domov byl malý byt v Brně, ale byl plný lásky a smíchu. Naučili jsme se spolu vařit, uklízet a hlavně se podporovat.",
    location: "Brno",
    icon: MapPin
  },
  {
    id: "travels",
    year: "2022",
    title: "Cestování světem",
    description: "Společně jsme začali objevovat svět. Od romantických víkendů v Alpách až po dobrodružnou dovolenou v Chorvatsku. Každá cesta nás k sobě více přiblížila.",
    location: "Evropa",
    icon: Camera
  },
  {
    id: "engagement",
    year: "2024",
    title: "Zásnuby",
    description: "V nádherném prostředí Krkonoš, při západu slunce na Sněžce, se Zbyněk zeptal té nejdůležitější otázky. Marcela řekla ANO! Byl to nejkrásnější okamžik našich životů.",
    location: "Sněžka, Krkonoše",
    icon: Sparkles,
    highlight: true
  },
  {
    id: "wedding-prep",
    year: "2025",
    title: "Přípravy svatby",
    description: "Celé měsíce jsme plánovali náš velký den. Od výběru místa přes svatební šaty až po každý detail. Nemůžeme se dočkat, až s vámi budeme slavit naši lásku!",
    location: "Kovalovice",
    icon: Heart
  }
];

export default function OurStory() {
  return (
    <section id="story" className="py-20 bg-gradient-to-br from-cream via-blush to-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
              Náš příběh <span className="heart-decoration">💕</span>
            </h2>
            <p className="text-lg text-charcoal/70 max-w-3xl mx-auto">
              Cesta dvou srdcí, která se našla a rozhodla se jít životem společně. 
              Objevte naši cestu od prvního setkání až k dnešnímu dni.
            </p>
          </motion.div>
        </div>

        {/* Story Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-romantic via-gold to-romantic h-full rounded-full opacity-30" />

          <div className="space-y-16">
            {storyMilestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative flex items-center ${
                    isLeft ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10 ${
                    milestone.highlight 
                      ? 'bg-gradient-to-br from-romantic to-love animate-pulse' 
                      : 'bg-gradient-to-br from-gold to-romantic'
                  }`}>
                    <Icon className="text-white" size={20} />
                  </div>

                  {/* Content card */}
                  <Card className={`w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 ${
                    isLeft ? 'mr-auto pr-16' : 'ml-auto pl-16'
                  } ${milestone.highlight ? 'ring-2 ring-romantic/30' : ''}`}>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          milestone.highlight 
                            ? 'bg-romantic/20 text-romantic' 
                            : 'bg-gold/20 text-gold'
                        }`}>
                          {milestone.year}
                        </span>
                      </div>

                      <h3 className="font-display text-xl font-bold text-charcoal mb-3">
                        {milestone.title}
                      </h3>

                      <p className="text-charcoal/70 mb-4 leading-relaxed">
                        {milestone.description}
                      </p>

                      {milestone.location && (
                        <div className="flex items-center gap-2 text-charcoal/60">
                          <MapPin size={16} />
                          <span className="text-sm font-medium">{milestone.location}</span>
                        </div>
                      )}

                      {milestone.highlight && (
                        <div className="mt-4 flex items-center gap-2 text-romantic">
                          <Sparkles size={16} />
                          <span className="text-sm font-medium">Speciální okamžik</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Fun Facts Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <Card className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold text-charcoal mb-8 text-center">
                Zajímavosti o nás <span className="heart-decoration">😊</span>
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-romantic mb-2">6</div>
                  <div className="text-sm text-charcoal/70">let spolu</div>
                </div>

                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-gold mb-2">3</div>
                  <div className="text-sm text-charcoal/70">země navštívené</div>
                </div>

                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-love mb-2">1000+</div>
                  <div className="text-sm text-charcoal/70">společných fotek</div>
                </div>

                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-romantic mb-2">∞</div>
                  <div className="text-sm text-charcoal/70">společných smíchů</div>
                </div>

                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-gold mb-2">2</div>
                  <div className="text-sm text-charcoal/70">společné domovy</div>
                </div>

                <div className="text-center p-4 bg-white/30 rounded-xl">
                  <div className="text-2xl font-bold text-love mb-2">1</div>
                  <div className="text-sm text-charcoal/70">velká láska</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Love Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-romantic/10 to-love/10 rounded-3xl shadow-lg border border-romantic/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <blockquote className="font-script text-2xl md:text-3xl text-charcoal mb-4 italic">
                "Najít někoho, koho milujete, a kdo miluje vás, 
                je největší štěstí na světě."
              </blockquote>
              <p className="text-charcoal/60">
                - Marcela & Zbyněk
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}