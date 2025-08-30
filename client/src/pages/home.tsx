import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";

import { Link } from "wouter";
import { Camera, Heart, MapPin, Users, Images, Trophy } from "lucide-react";
import GlassButton from "@/components/ui/glass-button";

// Assuming weddingDate and OurStory/WeddingDetails components are defined elsewhere
// For demonstration purposes, let's define a placeholder weddingDate and assume the other components exist.
const weddingDate = new Date("2025-10-11T14:00:00");

// Placeholder components if not imported, to ensure the code is runnable in structure
const OurStory = () => <div className="h-64 bg-gray-100 my-8 rounded-xl flex items-center justify-center">Our Story Section</div>;
const WeddingDetails = () => <div className="h-64 bg-gray-100 my-8 rounded-xl flex items-center justify-center">Wedding Details Section</div>;


export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          {/* Prioritní sekce - rychlé akce */}
          <section className="mb-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
                🎯 Hlavní akce
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/photo-quest" className="group bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="flex items-center space-x-3">
                    <Camera className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold text-lg">Fotovýzvy</h3>
                      <p className="text-pink-100 text-sm">Plň úkoly a získávej body</p>
                    </div>
                  </div>
                </a>

                <a href="/gallery" className="group bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="flex items-center space-x-3">
                    <Images className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold text-lg">Galerie</h3>
                      <p className="text-purple-100 text-sm">Prohlížej a lajkuj fotky</p>
                    </div>
                  </div>
                </a>

                <a href="/leaderboards" className="group bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold text-lg">Žebříček</h3>
                      <p className="text-amber-100 text-sm">Nejlepší fotografové</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          {/* Kompaktní countdown */}
          <section className="mb-8">
            <CountdownTimer targetDate={weddingDate} />
          </section>

          {/* Zbývající obsah */}
          <HeroSection />
          <OurStory />
          <WeddingDetails />
        </div>
      </div>
  );
}