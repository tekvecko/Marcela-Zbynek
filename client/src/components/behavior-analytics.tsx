
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Heart, Camera, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BehaviorAnalytics {
  totalActions: number;
  actionBreakdown: Record<string, number>;
  userEngagement: {
    totalUsers: number;
    averageActionsPerUser: number;
    mostActiveUsers: Array<{ email: string; actionCount: number }>;
  };
  popularContent: {
    mostLikedPhotos: Array<{ photoId: string; likes: number }>;
  };
}

interface AiInsight {
  id: string;
  insightType: string;
  category: string;
  insightData: any;
  confidence: number;
  sampleSize: number;
  lastUpdated: string;
}

export function BehaviorAnalytics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch behavior analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<BehaviorAnalytics>({
    queryKey: ["/api/admin/behavior-analytics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate AI insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/generate-ai-insights", { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-insights"] });
      toast({ 
        title: "AI poznatky vygenerovány", 
        description: data.message 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Chyba", 
        description: error.message || "Nepodařilo se vygenerovat poznatky",
        variant: "destructive"
      });
    },
  });

  if (analyticsLoading) {
    return <div className="text-center py-8">Načítání analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8">Nejsou dostupná žádná data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.totalActions}
          </div>
          <div className="text-sm text-blue-700">Celkem akcí</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {analytics.userEngagement.totalUsers}
          </div>
          <div className="text-sm text-green-700">Aktivních uživatelů</div>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Typ aktivit
        </h4>
        {Object.entries(analytics.actionBreakdown).map(([actionType, count]) => {
          const percentage = (count / analytics.totalActions) * 100;
          return (
            <div key={actionType} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">
                  {actionType.replace('_', ' ')}
                </span>
                <span>{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* Most Active Users */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Nejaktivnější uživatelé
        </h4>
        <div className="space-y-2">
          {analytics.userEngagement.mostActiveUsers.slice(0, 5).map((user, index) => (
            <div key={user.email} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <span className="text-sm font-medium">{user.actionCount} akcí</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Insights Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={() => generateInsightsMutation.mutate()}
          disabled={generateInsightsMutation.isPending}
          className="w-full"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Vygenerovat AI poznatky z dat
        </Button>
      </div>
    </div>
  );
}

export function AiInsightsDisplay() {
  // Fetch AI insights
  const { data: insights, isLoading: insightsLoading } = useQuery<AiInsight[]>({
    queryKey: ["/api/admin/ai-insights"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (insightsLoading) {
    return <div className="text-center py-8">Načítání AI poznatků...</div>;
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Zatím nejsou dostupné žádné AI poznatky
        </p>
        <p className="text-sm text-muted-foreground">
          Použijte tlačítko "Vygenerovat AI poznatky" pro analýzu dat
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {insight.category === 'technical_quality' ? 'Technická kvalita' : 
                     insight.category === 'emotional_content' ? 'Emoční obsah' : 
                     insight.category}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {insight.insightType.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={insight.confidence > 80 ? "default" : insight.confidence > 60 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {insight.confidence}% spolehlivost
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {insight.sampleSize} vzorků
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {insight.insightData.analysis}
              </p>
              
              {insight.insightData.preferences && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-medium">Ostrost</div>
                    <div>{(insight.insightData.preferences.sharpness * 100).toFixed(1)}%</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-medium">Kompozice</div>
                    <div>{(insight.insightData.preferences.composition * 100).toFixed(1)}%</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-medium">Osvětlení</div>
                    <div>{(insight.insightData.preferences.lighting * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {insight.insightData.topEmotions && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">Oblíbené emoce:</div>
                  <div className="flex flex-wrap gap-1">
                    {insight.insightData.topEmotions.slice(0, 5).map((emotion: any, index: number) => (
                      <Badge key={emotion.emotion} variant="outline" className="text-xs">
                        {emotion.emotion} ({emotion.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {insight.insightData.recommendations && (
                <div className="space-y-1">
                  <div className="text-xs font-medium">Doporučení:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {insight.insightData.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Aktualizováno: {new Date(insight.lastUpdated).toLocaleString('cs-CZ')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default BehaviorAnalytics;
