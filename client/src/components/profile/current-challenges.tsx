import { useQuery } from "@tanstack/react-query";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
}

export function CurrentChallenges() {
  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-semibold flex items-center">
            <i className="fas fa-target text-emerald-500 mr-2"></i>
            Aktivní Výzvy
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-3 w-3/4"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges?.slice(0, 3) || [];

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-semibold flex items-center">
          <i className="fas fa-target text-emerald-500 mr-2"></i>
          Dostupné Výzvy
        </h3>
      </div>
      <div className="p-6">
        {activeChallenges.length > 0 ? (
          <div className="space-y-4">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className="border border-border rounded-lg p-4" data-testid={`card-challenge-${challenge.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{challenge.title}</h4>
                  <span className="bg-emerald-500 text-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                    DOSTUPNÁ
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Kategorie</span>
                    <span className="text-xs text-muted-foreground capitalize">{challenge.category}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Odměna: +{challenge.points} XP
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <i className="fas fa-target text-2xl mb-2"></i>
            <p>Žádné dostupné výzvy</p>
            <p className="text-sm">Zkontroluj později nové výzvy</p>
          </div>
        )}
      </div>
    </div>
  );
}
