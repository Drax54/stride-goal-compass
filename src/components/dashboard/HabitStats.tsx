
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Habit } from './HabitCard';

interface HabitStatsProps {
  habits: Habit[];
}

export function HabitStats({ habits }: HabitStatsProps) {
  // Calculate statistics
  const completedHabits = habits.filter(h => h.completed === true).length;
  const completionRate = habits.length > 0 
    ? Math.round((completedHabits / habits.length) * 100) 
    : 0;
  const longestStreak = Math.max(...habits.map(h => h.streak), 0);
  const totalStreak = habits.reduce((sum, habit) => sum + habit.streak, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Completion Rate" 
          value={`${completionRate}%`}
          description="Today's habits"
          color="green"
          progress={completionRate}
        />
        
        <StatCard 
          title="Active Habits" 
          value={habits.length.toString()}
          description="Total habits"
          color="blue"
        />
        
        <StatCard 
          title="Longest Streak" 
          value={`${longestStreak} days`}
          description="Your best run"
          color="purple"
        />
        
        <StatCard 
          title="Total Streak Days" 
          value={totalStreak.toString()}
          description="Combined across habits"
          color="orange"
        />
      </div>
      
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Habit Performance</h3>
        <div className="space-y-4">
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full bg-habit-${habit.color} mr-2`} />
                <span className="font-medium">{habit.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">{habit.streak} day streak</span>
                <div className="h-2 w-24 rounded-full bg-muted">
                  <div 
                    className={`h-2 rounded-full bg-habit-${habit.color}`} 
                    style={{ width: `${Math.min((habit.streak / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  progress?: number;
}

function StatCard({ title, value, description, color, progress }: StatCardProps) {
  const colorMap = {
    green: 'bg-habit-green',
    blue: 'bg-habit-blue',
    purple: 'bg-habit-purple',
    orange: 'bg-habit-orange',
    red: 'bg-habit-red',
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {progress !== undefined && (
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div 
              className={`h-2 rounded-full ${colorMap[color]}`} 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HabitStats;
