import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <i className="fas fa-gamepad mr-2"></i>
            Gaming Platform
          </h1>
          <Button onClick={handleLogin} data-testid="button-login">
            Přihlásit se
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Vítej v Gaming Platform
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Gamifikovaný systém s výzvami, achievementy a skutečným pokrokem
          </p>
          <Button size="lg" onClick={handleLogin} data-testid="button-login-main">
            Začni hrát
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-target text-emerald-500 mr-3"></i>
                Výzvy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Plň různorodé výzvy, získávej body a postupuj na vyšší levely
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-trophy text-amber-500 mr-3"></i>
                Achievementy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Odemykej achievementy za splnění speciálních podmínek
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-gamepad text-purple-500 mr-3"></i>
                Mini-hry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Hraj mini-hry a soutěž s ostatními hráči o nejlepší skóre
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg p-8 text-center border border-border">
          <h3 className="text-2xl font-bold mb-4">Připraven na výzvu?</h3>
          <p className="text-muted-foreground mb-6">
            Přihlaš se a začni svou cestu k vrcholu žebříčku
          </p>
          <Button size="lg" onClick={handleLogin} data-testid="button-login-footer">
            Přihlásit se nyní
          </Button>
        </div>
      </div>
    </div>
  );
}
