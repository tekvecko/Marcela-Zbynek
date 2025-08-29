
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, Clock, Database, Activity } from "lucide-react";

interface PerformanceData {
  serverResponseTime: number;
  databaseResponseTime: number;
  memory: {
    used: number;
    total: number;
  };
  uptime: number;
}

interface NetworkSpeed {
  downloadSpeed: number;
  latency: number;
}

export default function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const testNetworkSpeed = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      // Test latency
      const latencyStart = Date.now();
      await fetch('/api/health');
      const latency = Date.now() - latencyStart;
      setProgress(25);

      // Test download speed with larger resource
      const downloadStart = Date.now();
      const response = await fetch('/api/quest-challenges');
      const data = await response.json();
      const downloadTime = Date.now() - downloadStart;
      
      // Estimate download speed (rough calculation)
      const dataSize = JSON.stringify(data).length / 1024; // KB
      const downloadSpeed = dataSize / (downloadTime / 1000); // KB/s
      setProgress(50);

      setNetworkSpeed({
        downloadSpeed: Math.round(downloadSpeed),
        latency
      });
      setProgress(75);

      // Get server performance data
      const perfResponse = await fetch('/api/performance');
      const perfData = await perfResponse.json();
      setPerformanceData(perfData);
      setProgress(100);

    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getSpeedCategory = (speed: number) => {
    if (speed > 100) return { label: "Vysoká", color: "text-green-600" };
    if (speed > 50) return { label: "Střední", color: "text-yellow-600" };
    return { label: "Nízká", color: "text-red-600" };
  };

  const getLatencyCategory = (latency: number) => {
    if (latency < 100) return { label: "Výborná", color: "text-green-600" };
    if (latency < 300) return { label: "Dobrá", color: "text-yellow-600" };
    return { label: "Pomalá", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor výkonu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testNetworkSpeed} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? "Testuji..." : "Spustit test rychlosti"}
          </Button>
          
          {isRunning && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Probíhá test...</div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {networkSpeed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Rychlost připojení
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{networkSpeed.downloadSpeed} KB/s</div>
                <div className={`text-sm ${getSpeedCategory(networkSpeed.downloadSpeed).color}`}>
                  {getSpeedCategory(networkSpeed.downloadSpeed).label} rychlost
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{networkSpeed.latency} ms</div>
                <div className={`text-sm ${getLatencyCategory(networkSpeed.latency).color}`}>
                  {getLatencyCategory(networkSpeed.latency).label} odezva
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Výkon serveru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-xl font-bold">{performanceData.serverResponseTime} ms</div>
                <div className="text-sm text-muted-foreground">Server odezva</div>
              </div>
              <div className="text-center">
                <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-xl font-bold">{performanceData.databaseResponseTime} ms</div>
                <div className="text-sm text-muted-foreground">Databáze odezva</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Využití paměti</div>
              <div className="flex justify-between text-sm">
                <span>Použito: {performanceData.memory.used} MB</span>
                <span>Celkem: {performanceData.memory.total} MB</span>
              </div>
              <Progress 
                value={(performanceData.memory.used / performanceData.memory.total) * 100} 
                className="h-2 mt-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
