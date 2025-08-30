import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, Users, Camera, Heart, Zap, RefreshCw, Brain, Target, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BehaviorData {
  totalSessions: number;
  averageSessionDuration: number;
  popularChallenges: Array<{ id: string; title: string; interactions: number }>;
  peakHours: Array<{ hour: number; activity: number }>;
  userRetentionRate: number;
  photoUploadSuccess: number;
}

interface AiInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'engagement' | 'performance' | 'user_behavior' | 'content';
  actionable: boolean;
  createdAt: string;
}

interface AiRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: string;
  autoApplicable: boolean;
}

export function BehaviorAnalytics() {
  const [data, setData] = useState<BehaviorData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/behavior-analytics');
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst analytická data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Načítám analytická data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          Zatím nejsou dostupná žádná analytická data
        </p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Načíst data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Přehled aktivity</h4>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {data.totalSessions}
          </div>
          <div className="text-xs text-blue-700">Celkem relací</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {Math.round(data.averageSessionDuration)}s
          </div>
          <div className="text-xs text-green-700">Průměrná délka</div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-medium">Nejpopulárnější výzvy</h5>
        {data.popularChallenges.slice(0, 3).map((challenge, index) => (
          <div key={challenge.id} className="flex justify-between items-center text-sm">
            <span className="truncate">{challenge.title}</span>
            <Badge variant="outline">{challenge.interactions}</Badge>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-medium">Úspěšnost nahrávání</h5>
        <Progress value={data.photoUploadSuccess} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {data.photoUploadSuccess}% úspěšných nahrání
        </p>
      </div>
    </div>
  );
}

export function AiInsightsDisplay() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ai-insights', { method: 'POST' });
      const data = await response.json();
      setInsights(data.insights || []);
      toast({
        title: "AI poznatky vygenerovány",
        description: `Nalezeno ${data.insights?.length || 0} poznatků`
      });
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat AI poznatky",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/admin/ai-insights');
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement':
        return <Heart className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'user_behavior':
        return <Users className="h-4 w-4" />;
      case 'content':
        return <Camera className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Generujem AI poznatky...</span>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Zatím nejsou dostupné žádné AI poznatky
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Použijte tlačítko "Vygenerovat AI poznatky" pro analýzu dat
        </p>
        <Button onClick={generateInsights} disabled={loading}>
          <Brain className="h-4 w-4 mr-2" />
          Vygenerovat AI poznatky
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">AI poznatky</h4>
        <Button onClick={generateInsights} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualizovat
        </Button>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-blue-100">
                {getCategoryIcon(insight.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium truncate">{insight.title}</h5>
                  <Badge variant={insight.confidence > 80 ? "default" : "secondary"} className="text-xs">
                    {insight.confidence}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                {insight.actionable && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Akční
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DynamicAiRecommendations() {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ai-recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst AI doporučení",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ai-recommendations/${id}/apply`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({
          title: "Doporučení aplikováno",
          description: "AI doporučení bylo úspěšně implementováno"
        });
        fetchRecommendations();
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aplikovat doporučení",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Načítám AI doporučení...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Aktivní doporučení</h4>
        <Button onClick={fetchRecommendations} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualizovat
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Žádná AI doporučení nejsou dostupná
          </p>
          <p className="text-sm text-muted-foreground">
            AI analyzuje chování uživatelů a vygeneruje doporučení automaticky
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium truncate">{rec.title}</h5>
                      <Badge className={getPriorityColor(rec.priority)} variant="outline">
                        {rec.priority === 'high' ? 'Vysoká' : rec.priority === 'medium' ? 'Střední' : 'Nízká'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Dopad: {rec.estimatedImpact}</span>
                      <span>•</span>
                      <span>{rec.category}</span>
                    </div>
                  </div>
                </div>

                {rec.autoApplicable && (
                  <Button
                    onClick={() => applyRecommendation(rec.id)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    Aplikovat automaticky
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}