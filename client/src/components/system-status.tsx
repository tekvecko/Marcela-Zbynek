
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function SystemStatus() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const runSystemChecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-status');
      const data = await response.json();
      setChecks(data.checks || []);
    } catch (error) {
      console.error('Failed to run system checks:', error);
      setChecks([
        {
          name: 'Systémová kontrola',
          status: 'error',
          message: 'Nepodařilo se spustit kontrolu systému',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Chyba</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Varování</Badge>;
      default:
        return <Badge variant="secondary">Neznámý</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Kontroly systému</h3>
        <Button
          onClick={runSystemChecks}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualizovat
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Spouštím kontroly systému...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checks.map((check, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <h4 className="font-medium">{check.name}</h4>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                      {check.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof check.details === 'string' 
                            ? check.details 
                            : JSON.stringify(check.details)
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              </CardContent>
            </Card>
          ))}

          {checks.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Žádné kontroly systému nejsou dostupné</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
