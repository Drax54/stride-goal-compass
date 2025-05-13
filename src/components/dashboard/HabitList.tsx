
import { useState } from 'react';
import { HabitCard, Habit } from './HabitCard';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HabitListProps {
  viewType: 'daily' | 'weekly' | 'monthly' | 'analytics';
}

// Sample data
const demoHabits: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: 'Start the day with 10 minutes of mindfulness',
    goal: '10 minutes daily',
    streak: 5,
    completed: null,
    color: 'purple'
  },
  {
    id: '2',
    name: 'Daily Exercise',
    description: 'Get moving for at least 30 minutes',
    goal: '30 minutes of activity',
    streak: 3,
    completed: null,
    color: 'teal'
  },
  {
    id: '3',
    name: 'Read a Book',
    description: 'Read at least 10 pages',
    goal: '10 pages daily',
    streak: 7,
    completed: null,
    color: 'blue'
  },
  {
    id: '4',
    name: 'Drink Water',
    description: 'Drink 8 glasses of water',
    goal: '8 glasses daily',
    streak: 9,
    completed: null,
    color: 'blue'
  },
  {
    id: '5',
    name: 'Learning Spanish',
    description: 'Practice for 20 minutes',
    goal: '20 minutes daily',
    streak: 4,
    completed: null,
    color: 'orange'
  }
];

export function HabitList({ viewType }: HabitListProps) {
  const [habits, setHabits] = useState<Habit[]>(demoHabits);
  const { toast } = useToast();

  const handleComplete = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: true, streak: habit.streak + 1 } : habit
    ));
    toast({
      title: "Habit completed!",
      description: "Great job! Keep up the good work.",
    });
  };

  const handleMiss = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: false, streak: 0 } : habit
    ));
    toast({
      title: "Habit missed",
      description: "Don't worry, you can try again tomorrow.",
    });
  };

  const handleReset = (id: string) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: null } : habit
    ));
  };

  const handleAddHabit = () => {
    toast({
      title: "Not connected to Supabase",
      description: "Adding new habits will be implemented when connected to Supabase",
    });
  };

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Habits</h2>
        <Button className="bg-accent hover:bg-accent/90" onClick={handleAddHabit}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Habit
        </Button>
      </div>
      
      {viewType === 'daily' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {habits.map(habit => (
            <HabitCard 
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
              onMiss={handleMiss}
              onReset={handleReset}
            />
          ))}
        </div>
      )}
      
      {viewType === 'weekly' && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center p-8">
            Weekly view will display habit progress over the week.
            <br />Connect to Supabase to implement this functionality.
          </p>
          <div className="grid grid-cols-7 gap-4 rounded-lg border bg-card p-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="flex flex-col items-center">
                <div className="text-sm font-medium mb-2">{day}</div>
                <div className="space-y-2">
                  {habits.slice(0, 3).map(habit => (
                    <div 
                      key={habit.id} 
                      className={`w-6 h-6 rounded-full border ${
                        i < 2 ? 'bg-habit-green border-habit-green' : 
                        i === 2 ? 'bg-habit-red border-habit-red' : 'bg-transparent border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewType === 'monthly' && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center p-8">
            Monthly view will display habit progress over the month.
            <br />Connect to Supabase to implement this functionality.
          </p>
          <div className="grid grid-cols-7 gap-2 rounded-lg border bg-card p-4">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="aspect-square flex flex-col items-center justify-center border rounded p-1">
                <div className="text-xs font-medium">{i + 1}</div>
                <div className="mt-1 w-2 h-2 rounded-full bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewType === 'analytics' && <HabitStats habits={habits} />}
      
      {habits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No habits yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first habit to start tracking your progress.
          </p>
          <Button className="mt-4 bg-accent hover:bg-accent/90" onClick={handleAddHabit}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Habit
          </Button>
        </div>
      )}
    </div>
  );
}

function HabitStats({ habits }: { habits: Habit[] }) {
  // Placeholder for actual analytics
  const completionRate = 67;
  const totalDaysTracked = 14;
  const longestStreak = Math.max(...habits.map(h => h.streak));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div 
                className="h-2 rounded-full bg-habit-green" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysTracked}</div>
            <p className="text-xs text-muted-foreground">Total days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Habit Performance</h3>
        <div className="space-y-4">
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`mr-2 h-3 w-3 rounded-full bg-habit-${habit.color}`} />
                <span className="font-medium">{habit.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">{habit.streak} day streak</span>
                <div className="h-2 w-24 rounded-full bg-muted">
                  <div 
                    className={`h-2 rounded-full bg-habit-${habit.color}`} 
                    style={{ width: `${(habit.streak / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Connect to Supabase for more detailed analytics
        </div>
      </div>
    </div>
  );
}

export default HabitList;
