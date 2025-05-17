
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  format, 
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { enGB } from 'date-fns/locale';
import { logEvent, logDebug, logError, createTimer, LogCategory } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';

// Define the props interface for WeekView
interface WeekViewProps {
  viewMode: 'day' | 'week' | 'month' | 'year';
  key?: number;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  goal_id: string;
  icon?: string;
}

interface Goal {
  id: string;
  goal: string;
  habits: Habit[];
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  status: 'completed' | null;
  user_id: string;
}

const WeekView: React.FC<WeekViewProps> = ({ viewMode = 'week' }) => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, 'completed' | null>>({});
  
  // Get current date for highlighting today
  const today = new Date();

  // Generate dates for the week view
  useEffect(() => {
    const generateDates = () => {
      let dates: Date[] = [];
      
      if (viewMode === 'week') {
        // Generate all days in the week
        const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        dates = eachDayOfInterval({ start: weekStart, end: weekEnd });
        logDebug(LogCategory.UI, `Week view dates generated`, {
          start: format(weekStart, 'yyyy-MM-dd'),
          end: format(weekEnd, 'yyyy-MM-dd')
        });
      } else if (viewMode === 'month') {
        // Generate all days in the month
        const monthStart = startOfMonth(currentWeekStart);
        const monthEnd = endOfMonth(currentWeekStart);
        dates = eachDayOfInterval({ start: monthStart, end: monthEnd });
        logDebug(LogCategory.UI, `Month view dates generated`, {
          start: format(monthStart, 'yyyy-MM-dd'),
          end: format(monthEnd, 'yyyy-MM-dd')
        });
      }
      
      setDisplayDates(dates);
    };
    
    generateDates();
  }, [currentWeekStart, viewMode]);

  // Fetch goals and habits when component mounts or dates change
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        logEvent(LogCategory.HABITS, `Fetching goals and habits for ${viewMode} view`);
        const timer = createTimer(LogCategory.PERFORMANCE, 'Goals and habits fetch');
        
        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id);

        if (goalsError) {
          logError(LogCategory.DB, 'Error fetching goals', { error: goalsError.message });
          setError('Could not fetch goals. Please try again.');
          setLoading(false);
          return;
        }
        
        // Fetch habits
        const { data: habitsData, error: habitsError } = await supabase
            .from('habits')
            .select('*')
          .eq('user_id', user.id);
        
        if (habitsError) {
          logError(LogCategory.DB, 'Error fetching habits', { error: habitsError.message });
          setError('Could not fetch habits. Please try again.');
          setLoading(false);
          return;
        }
        
        // Track habit names globally to prevent duplicates across goals
        const globalHabitNames = new Map<string, Habit>();
        const uniqueHabits: Habit[] = [];
        
        habitsData?.forEach(habit => {
          if (!globalHabitNames.has(habit.name)) {
            globalHabitNames.set(habit.name, habit);
            uniqueHabits.push(habit);
          }
        });
        
        // Create a mapping of goal ID to goal for faster lookups
        const goalMap = new Map();
        goalsData?.forEach(goal => goalMap.set(goal.id, { ...goal, habits: [] }));
        
        // Assign habits to goals
        uniqueHabits.forEach(habit => {
          const goalId = habit.goal_id;
          const goal = goalMap.get(goalId);
          if (goal) {
            // Only add if this habit name doesn't already exist in this goal
            if (!goal.habits.some((h: Habit) => h.name === habit.name)) {
              goal.habits.push(habit);
            }
          }
        });
        
        // Convert the map to an array for state
        const mappedGoals = Array.from(goalMap.values());
        setGoals(mappedGoals);
        
        // Fetch habit completions for the displayed date range
        if (displayDates.length > 0) {
          await fetchCompletions(user.id);
        }
        
        timer.stop({
          goalsCount: goalsData?.length || 0,
          habitsCount: uniqueHabits?.length || 0
        });
        
      } catch (err) {
        logError(LogCategory.SYSTEM, 'Unexpected error in WeekView', { 
          error: err instanceof Error ? err.message : String(err)
        });
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (displayDates.length > 0 && user) {
      fetchGoals();
    }
  }, [displayDates, viewMode, user]);

  const fetchCompletions = async (userId: string) => {
    if (displayDates.length === 0) {
      logError(LogCategory.HABITS, 'Cannot fetch completions: no dates available');
      return;
    }
    
    try {
      // Determine the date range for week view
      const startDate = displayDates[0];
      const endDate = displayDates[displayDates.length - 1];
      
      logDebug(LogCategory.HABITS, `Fetching habit completions`, {
        weekStart: format(startDate, 'yyyy-MM-dd'),
        weekEnd: format(endDate, 'yyyy-MM-dd')
      });

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', format(startDate, 'yyyy-MM-dd'))
        .lte('completed_date', format(endDate, 'yyyy-MM-dd'));
      
      if (error) {
        logError(LogCategory.DB, 'Error fetching completions', { error: error.message });
        return;
      }
      
      // Update completions state
      setCompletions(data || []);
      
      // Also update habitCompletions derived state for faster lookups
      const completionsMap: Record<string, 'completed' | null> = {};
      
      if (data) {
        data.forEach(completion => {
          const key = `${completion.habit_id}-${completion.completed_date}`;
          completionsMap[key] = completion.status;
        });
      }
      
      setHabitCompletions(completionsMap);
      
    } catch (err) {
      logError(LogCategory.SYSTEM, 'Error in fetchCompletions', { 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  // Handle habit completion toggling for current day only
  const handleHabitCompletion = async (habitId: string, date: Date) => {
    if (!user) return;
    
    // Format the date for storage and display
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Only allow completion for the current day
    if (!isSameDay(date, today)) {
      logDebug(LogCategory.HABITS, 'Cannot complete habit for day other than today', { date: dateStr });
      return;
    }
    
    logEvent(LogCategory.HABITS, 'Habit completion toggled', { 
      habitId, 
      date: dateStr
    });
    
    try {
      // Find completion status in state
      const key = `${habitId}-${dateStr}`;
      const currentStatus = habitCompletions[key] || null;
      
      // Toggle between completed and not completed
      const newStatus = currentStatus === 'completed' ? null : 'completed';
      
      // Update local state immediately for UI responsiveness
      setHabitCompletions(prev => ({
        ...prev,
        [key]: newStatus as 'completed' | null
      }));
      
      // Perform database update
      if (newStatus === 'completed') {
        // Insert completion record
        const { error: insertError } = await supabase
          .from('habit_completions')
          .upsert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: dateStr,
            status: 'completed'
          });
          
        if (insertError) {
          setError("Error: Failed to update habit. Please try again.");
          
          // Revert the local state
          setHabitCompletions(prev => ({
            ...prev,
            [key]: currentStatus
          }));
        } else {
          // Refresh completions
          fetchCompletions(user.id);
        }
      } else {
        // Delete completion record
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .match({
            habit_id: habitId,
            user_id: user.id,
            completed_date: dateStr
          });
          
        if (deleteError) {
          setError("Error: Failed to update habit. Please try again.");
          
          // Revert the local state
          setHabitCompletions(prev => ({
            ...prev,
            [key]: currentStatus
          }));
        } else {
          // Refresh completions
          fetchCompletions(user.id);
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const getCompletionStatus = (habitId: string, date: Date): 'completed' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check database completions
    const completion = completions.find(
      c => c.habit_id === habitId && c.completed_date === dateStr
    );
    
    return completion?.status || null;
  };

  // Render day numbers at the top of the week view
  const renderDayNumbers = () => {
    return (
      <div className="mb-4 mt-2">
        <div className="flex">
          {displayDates.map((date, index) => {
            const day = format(date, 'd');
            const dayName = format(date, 'EEE', { locale: enGB });
            const isCurrentDay = isSameDay(date, today);
            
            return (
              <div 
                key={`day-${index}`}
                className={`
                  w-14 flex flex-col items-center justify-center text-xs
                  ${isCurrentDay 
                    ? 'text-red-500 font-bold bg-red-50 rounded-full ring-2 ring-red-500' 
                    : 'text-gray-600'}
                `}
              >
                <span>{dayName}</span>
                <span>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a habit's week view
  const renderHabit = (habit: Habit) => {
    return (
      <div className="mt-2">
        {/* Habit label and checkboxes */}
        <div className="mb-6">
          {/* Habit label - simple with no delete button */}
          <div className="flex items-center mb-2">
            <span className="text-xl mr-2">{habit.icon || '🎯'}</span>
            <span className="text-base font-medium">{habit.name}</span>
          </div>
          
          {/* Checkboxes aligned with days above */}
          <div className="flex">
            {displayDates.map((date) => {
              const isCurrentDay = isSameDay(date, today);
              const status = getCompletionStatus(habit.id, date);
              const isCompleted = status === 'completed';
              
              return (
                <div 
                  key={date.toISOString()}
                  className="w-14 h-14 flex items-center justify-center"
                >
                  <div 
                    className={`
                      w-12 h-12 border flex items-center justify-center rounded-full
                      ${isCompleted ? 'bg-green-100 border-green-500' : isCurrentDay ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'} 
                      ${isCurrentDay ? 'ring-2 ring-red-500' : ''}
                    `}
                    onClick={() => {
                      if (isCurrentDay) {
                        handleHabitCompletion(habit.id, date);
                      }
                    }}
                  >
                    {isCompleted && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Function to render goals and their habits
  const renderGoals = () => {
    if (goals.length === 0) {
      return (
        <p className="text-center text-gray-500 py-8">
          No goals or habits found. Try adding some!
        </p>
      );
    }
    
    // Create a map to track which goal names we've already rendered
    const renderedGoalNames = new Map<string, boolean>();
    
    return goals.map((goal) => {
      // Skip this goal if we've already rendered one with the same name
      if (renderedGoalNames.has(goal.goal)) {
        return null;
      }
      
      // Mark this goal name as rendered
      renderedGoalNames.set(goal.goal, true);
      
      // Filter out duplicate habits
      const renderedHabits = new Map<string, boolean>();
      const uniqueHabits = goal.habits.filter(habit => {
        if (renderedHabits.has(habit.name)) {
          return false;
        }
        renderedHabits.set(habit.name, true);
        return true;
      });
      
      // Return the goal with its unique habits
      return (
        <div key={goal.id} className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{goal.goal}</h3>
          <div className="space-y-6">
            {uniqueHabits.map(habit => renderHabit(habit))}
          </div>
        </div>
      );
    }).filter(Boolean); // Filter out null values
  };

  // Navigation methods
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentWeekStart(prev => subWeeks(prev, 1));
    } else if (viewMode === 'month') {
      setCurrentWeekStart(prev => subWeeks(prev, 4)); // Roughly one month
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentWeekStart(prev => addWeeks(prev, 1));
    } else if (viewMode === 'month') {
      setCurrentWeekStart(prev => addWeeks(prev, 4)); // Roughly one month
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-xl text-gray-600">{viewMode === 'week' ? 'Week' : 'Month'}</h2>
          <h1 className="text-3xl font-bold text-red-500">
            {viewMode === 'week'
              ? `${format(displayDates[0], 'MMM d')} - ${format(displayDates[displayDates.length - 1], 'MMM d')}`
              : format(currentWeekStart, 'MMMM yyyy')}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={`Previous ${viewMode}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={`Next ${viewMode}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day numbers grid - shown once at the top */}
      {renderDayNumbers()}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong> 
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Helper tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Habit Tracking Tip</p>
          <p>Click on the circles beside each habit to mark them as complete. Green checkmarks indicate completed habits.</p>
          <p className="mt-1">Current day is highlighted with a red ring.</p>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="space-y-8">
        {renderGoals()}
      </div>
    </div>
  );
};

export default WeekView;
