import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VerificationTooltip from "@/components/ui/verification-tooltip";
import GlassButton from "@/components/ui/glass-button";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";

// Sample verification data for demonstration
const sampleVerifications = [
  {
    id: 1,
    title: "Vysoká shoda - Ověřeno",
    isVerified: true,
    verificationScore: 0.95,
    aiAnalysis: "Fotografie perfektně zachycuje moment výměny slibů. Viditelné jsou oba novomanželé, ženich drží ruku nevěsty, v pozadí je svatební altar s květinovou výzdobou. Kompozice je vynikající, fotka je ostrá a má správné osvětlení.",
    suggestedImprovements: "Fotografie je již v perfektní kvalitě a splňuje všechny požadavky výzvy.",
    challengeTitle: "Okamžik 'Ano' 💍"
  },
  {
    id: 2,
    title: "Střední shoda - Možná relevantní",
    isVerified: false,
    verificationScore: 0.75,
    aiAnalysis: "Na fotografii je vidět svatební obřad, ale moment výměny slibů není zcela jasný. Novomanželé stojí u altáru, ale není zachycen přesný okamžik 'ano'. Kvalita fotografie je dobrá.",
    suggestedImprovements: "Zkuste zachytit přesnější moment během výměny slibů, kdy je patrné gesto nebo výraz tváře během 'ano'.",
    challengeTitle: "Okamžik 'Ano' 💍"
  },
  {
    id: 3,
    title: "Nízká shoda - Neodpovídá",
    isVerified: false,
    verificationScore: 0.25,
    aiAnalysis: "Fotografie zobrazuje svatební prostředí, ale nezachycuje moment výměny slibů ani novomanžele. Je to spíše obecný pohled na svatební hostinu nebo dekoraci.",
    suggestedImprovements: "Pro splnění této výzvy je potřeba zaměřit se na novomanžele během samotného obřadu, konkrétně na moment kdy říkají 'ano'.",
    challengeTitle: "Okamžik 'Ano' 💍"
  },
  {
    id: 4,
    title: "Velmi nízká shoda - Zamítnuto",
    isVerified: false,
    verificationScore: 0.05,
    aiAnalysis: "Obrázek nezobrazuje žádný svatební kontext ani výměnu slibů. Jsou na něm pouze grafické prvky nebo nesouvisející obsah.",
    suggestedImprovements: "Nahrajte fotografii, která skutečně zachycuje svatební moment související s výzvou - konkrétně moment výměny slibů nebo 'ano' na svatbě.",
    challengeTitle: "Okamžik 'Ano' 💍"
  }
];

export default function VerificationDemoPage() {
  const [, setLocation] = useLocation();
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-love">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět do Admin
          </GlassButton>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-romantic to-love bg-clip-text text-transparent mb-4">
              AI Verification Tooltip Demo
            </h1>
            <p className="text-charcoal/70 text-lg max-w-2xl mx-auto">
              Ukázka pokročilého AI ověřování s interaktivními tooltips a detailními analýzami
            </p>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {sampleVerifications.map((demo) => (
            <Card key={demo.id} className="bg-white/80 backdrop-blur-sm border-white/40 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-charcoal mb-2">
                  {demo.title}
                </CardTitle>
                <div className="flex items-center justify-center">
                  <VerificationTooltip
                    isVerified={demo.isVerified}
                    verificationScore={demo.verificationScore}
                    aiAnalysis={demo.aiAnalysis}
                    suggestedImprovements={demo.suggestedImprovements}
                    challengeTitle={demo.challengeTitle}
                    size="lg"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-center">
                  <Badge 
                    variant={demo.isVerified ? "default" : "secondary"}
                    className="mb-2"
                  >
                    {Math.round(demo.verificationScore * 100)}% shoda
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDemo(selectedDemo === demo.id ? null : demo.id)}
                    className="text-xs"
                  >
                    {selectedDemo === demo.id ? "Skrýt" : "Zobrazit"} analýzu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Analysis */}
        {selectedDemo && (
          <Card className="bg-white/90 backdrop-blur-sm border-white/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-blue-500" size={20} />
                Detailní AI Analýza - {sampleVerifications.find(d => d.id === selectedDemo)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const demo = sampleVerifications.find(d => d.id === selectedDemo);
                if (!demo) return null;

                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-blush/20 rounded-lg">
                      <h4 className="font-medium text-sm text-charcoal mb-2">Výzva:</h4>
                      <p className="text-sm text-charcoal/80">{demo.challengeTitle}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-charcoal mb-2">AI Hodnocení:</h4>
                      <p className="text-sm text-charcoal/80 leading-relaxed">{demo.aiAnalysis}</p>
                    </div>

                    {demo.suggestedImprovements && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm text-charcoal mb-2">Návrhy na zlepšení:</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{demo.suggestedImprovements}</p>
                      </div>
                    )}

                    <div className="text-xs text-charcoal/50 text-center pt-4 border-t">
                      Analýza provedena pomocí Gemini AI • Confidence: {Math.round(demo.verificationScore * 100)}%
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Feature Description */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-center">Funkce AI Verification Tooltip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <h4 className="font-medium text-charcoal mb-1">Smart Tooltips</h4>
                <p className="text-xs text-charcoal/70">Hover pro základní info, klik pro detaily</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="text-blue-600" size={20} />
                </div>
                <h4 className="font-medium text-charcoal mb-1">AI Analýza</h4>
                <p className="text-xs text-charcoal/70">Podrobné vyhodnocení shody s výzvou</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 text-xl">💡</span>
                </div>
                <h4 className="font-medium text-charcoal mb-1">Návrhy</h4>
                <p className="text-xs text-charcoal/70">Personalizované tipy pro zlepšení</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}