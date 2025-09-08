import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChallengeCard from '@/components/challenge-card';
import { Search, Filter, SortDesc } from 'lucide-react';
import type { ChallengeWithSubmissions } from '../../../shared/schema';

export default function Challenges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const [filterBy, setFilterBy] = useState('all');

  const { data: challenges, isLoading } = useQuery<ChallengeWithSubmissions[]>({
    queryKey: ['/api/challenges'],
  });

  const filteredChallenges = challenges?.filter(challenge => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!challenge.title.toLowerCase().includes(searchLower) && 
          !challenge.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filterBy === 'submitted') {
      return challenge.hasSubmitted;
    } else if (filterBy === 'not-submitted') {
      return !challenge.hasSubmitted;
    }

    return true;
  }) || [];

  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.points - a.points;
      case 'participants':
        return b.participants - a.participants;
      case 'deadline':
        return a.daysLeft - b.daysLeft;
      default:
        return 0;
    }
  });

  return (
    <main className="container mx-auto px-4 py-8" data-testid="challenges-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Photography Challenges</h1>
        <p className="text-muted-foreground">
          Explore and participate in exciting photography challenges to earn points and improve your skills.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-challenges"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40" data-testid="filter-challenges">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Challenges</SelectItem>
              <SelectItem value="not-submitted">Not Submitted</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40" data-testid="sort-challenges">
              <SortDesc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Highest Points</SelectItem>
              <SelectItem value="participants">Most Popular</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-primary" data-testid="total-challenges">
            {challenges?.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Challenges</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-accent" data-testid="submitted-challenges">
            {challenges?.filter(c => c.hasSubmitted).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Submitted</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-orange-500" data-testid="remaining-challenges">
            {challenges?.filter(c => !c.hasSubmitted).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Remaining</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-lg">
          <div className="text-2xl font-bold text-blue-500" data-testid="total-points-available">
            {challenges?.reduce((sum, c) => sum + c.points, 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse" data-testid={`challenge-skeleton-${i}`}>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="flex space-x-4">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-9 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedChallenges.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground" data-testid="results-count">
              Showing {sortedChallenges.length} of {challenges?.length || 0} challenges
            </p>
            {searchTerm && (
              <Badge variant="outline" className="ml-2">
                Search: {searchTerm}
              </Badge>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="challenges-grid">
            {sortedChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12" data-testid="no-challenges-found">
          <div className="text-muted-foreground mb-4">
            {searchTerm || filterBy !== 'all' 
              ? 'No challenges match your filters'
              : 'No challenges available at the moment'
            }
          </div>
          {(searchTerm || filterBy !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
              }}
              data-testid="clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
