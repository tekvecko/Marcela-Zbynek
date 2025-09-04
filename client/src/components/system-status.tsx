import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string | object;
}

interface SystemStatusResponse {
  checks: SystemCheck[];
  timestamp: string;
  uptime: number;
}

export default function SystemStatus() {
  const { toast } = useToast();

  const { data: systemStatus, isLoading, error, refetch } = useQuery<SystemStatusResponse>({
    queryKey: ['/api/admin/system-status'],
    queryFn: () => apiRequest('/api/admin/system-status'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    toast({ title: "Status aktualizován" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Načítání systémového statusu...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Chyba při načítání statusu</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'Neznámá chyba'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default' as const;
      case 'warning':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const renderDetails = (details: string | object | undefined) => {
    if (!details) return null;

    if (typeof details === 'string') {
      return <span className="break-words">{details}</span>;
    }

    if (typeof details === 'object') {
      try {
        return (
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
            {JSON.stringify(details, null, 2)}
          </pre>
        );
      } catch (error) {
        return <span className="text-red-500">Chyba při zobrazení detailů</span>;
      }
    }

    return <span>{String(details)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kontrola systému</h3>
          <p className="text-sm text-muted-foreground">
            Poslední aktualizace: {systemStatus ? new Date(systemStatus.timestamp).toLocaleString('cs-CZ') : 'Neznámá'}
          </p>
          <p className="text-sm text-muted-foreground">
            Uptime: {systemStatus ? Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualizovat
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {systemStatus?.checks.map((check, index) => (
          <Card key={index} className="border-l-4" style={{
            borderLeftColor: check.status === 'success' ? '#10b981' : 
                           check.status === 'warning' ? '#f59e0b' : '#ef4444'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  {check.name}
                </CardTitle>
                <Badge variant={getStatusVariant(check.status)}>
                  {check.status === 'success' ? 'OK' : 
                   check.status === 'warning' ? 'Varování' : 'Chyba'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">{check.message}</p>
                {check.details && (
                  <div className="text-xs text-muted-foreground">
                    {renderDetails(check.details)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}