import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Camera, Heart, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Our
            <span className="text-pink-600 dark:text-pink-400"> Wedding Website</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join us in creating beautiful memories with interactive photo challenges, 
            real-time celebrations, and shared moments of joy.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg"
            data-testid="button-login"
          >
            <Heart className="mr-2 h-5 w-5" />
            Join the Celebration
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center border-pink-200 dark:border-pink-800">
            <CardHeader>
              <Camera className="h-12 w-12 text-pink-600 dark:text-pink-400 mx-auto mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">Photo Quests</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete fun photo challenges and capture special wedding moments
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200 dark:border-purple-800">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with other guests and share in the celebration together
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-200 dark:border-blue-800">
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">Real-time</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Experience the wedding in real-time with live updates and interactions
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 dark:border-green-800">
            <CardHeader>
              <Heart className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <CardTitle className="text-gray-900 dark:text-white">Memories</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create lasting memories that the couple will treasure forever
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Wedding Info */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Special Day
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Be part of our wedding celebration by logging in and participating in our 
            interactive photo challenges. Help us capture every precious moment!
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            data-testid="button-login-bottom"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}