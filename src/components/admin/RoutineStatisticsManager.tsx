import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, Users, TrendingUp } from 'lucide-react';

interface PlanStats {
  id: string;
  title: string;
  avg_rating: number;
  rating_count: number;
  adoption_count: number;
}

export function RoutineStatisticsManager() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-routine-statistics'],
    queryFn: async () => {
      // Get all plans with their ratings and adoption counts
      const { data: plans, error: plansError } = await supabase
        .from('routine_plans')
        .select('id, title')
        .eq('is_active', true);
      
      if (plansError) throw plansError;

      // Get ratings for each plan
      const { data: ratings, error: ratingsError } = await supabase
        .from('routine_plan_ratings')
        .select('plan_id, rating');
      
      if (ratingsError) throw ratingsError;

      // Get adoption counts
      const { data: adoptions, error: adoptionsError } = await supabase
        .from('user_routine_plans')
        .select('plan_id');
      
      if (adoptionsError) throw adoptionsError;

      // Calculate stats for each plan
      const planStats: PlanStats[] = plans.map(plan => {
        const planRatings = ratings.filter(r => r.plan_id === plan.id);
        const avgRating = planRatings.length > 0 
          ? planRatings.reduce((sum, r) => sum + r.rating, 0) / planRatings.length 
          : 0;
        const adoptionCount = adoptions.filter(a => a.plan_id === plan.id).length;

        return {
          id: plan.id,
          title: plan.title,
          avg_rating: Math.round(avgRating * 10) / 10,
          rating_count: planRatings.length,
          adoption_count: adoptionCount,
        };
      });

      // Sort by adoption count
      return planStats.sort((a, b) => b.adoption_count - a.adoption_count);
    },
  });

  const { data: recentRatings } = useQuery({
    queryKey: ['admin-recent-routine-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plan_ratings')
        .select(`
          id,
          rating,
          created_at,
          plan:routine_plans(title),
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;

      // Get user profiles
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      return data.map(rating => ({
        ...rating,
        profile: profiles?.find(p => p.id === rating.user_id),
      }));
    },
  });

  const totalAdoptions = stats?.reduce((sum, s) => sum + s.adoption_count, 0) || 0;
  const avgOverallRating = stats && stats.length > 0
    ? stats.reduce((sum, s) => sum + s.avg_rating * s.rating_count, 0) / 
      stats.reduce((sum, s) => sum + s.rating_count, 0) || 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Adoptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdoptions}</div>
            <p className="text-xs text-muted-foreground">
              Routines added by users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgOverallRating.toFixed(1)} / 5
            </div>
            <p className="text-xs text-muted-foreground">
              Across all rated plans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Published routine templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans by Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Plans by Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !stats?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans with data yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Adoptions</TableHead>
                  <TableHead className="text-right">Avg Rating</TableHead>
                  <TableHead className="text-right"># Ratings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((plan, index) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{plan.title}</TableCell>
                    <TableCell className="text-right">{plan.adoption_count}</TableCell>
                    <TableCell className="text-right">
                      {plan.avg_rating > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          {plan.avg_rating}
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{plan.rating_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentRatings?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No ratings yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRatings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>{(rating.plan as { title: string })?.title}</TableCell>
                    <TableCell>
                      {rating.profile?.full_name || rating.profile?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {rating.rating}
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
