import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Circle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  format, 
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import { enGB } from 'date-fns/locale';
import { logEvent, logDebug, logError, createTimer, LogCategory } from '../../lib/logger';

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

interface User {
  id: string;
  email?: string;
}

interface DbHabit {
  id: string;
  name: string;
  description: string;
  goal_id: string;
  user_id: string;
  icon?: string;
}

interface DbGoal {
  id: string;
  goal: string;
  user_id: string;
  habits: Habit[];
}

interface GeneratedHabit {
  id: string;
  name: string;
  description: string;
  goal_id: string;
  user_id: string;
  icon?: string;
}

const WeekView: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingHabits, setProcessingHabits] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, 'completed' | null>>({});
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Get current date for highlighting today
  const today = new Date();

  // When component mounts, check for authenticated user
  useEffect(() => {
    const checkAuth = async () => {
      logEvent(LogCategory.AUTH, 'Checking user authentication');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        logError(LogCategory.AUTH, 'Authentication error in WeekView', { 
          error: authError.message 
        });
      }
      
      setUser(user);
      
      logEvent(LogCategory.AUTH, 'User auth state checked in WeekView', {
        isAuthenticated: !!user,
        userId: user?.id
      });
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      
      logEvent(LogCategory.AUTH, 'Auth state changed in WeekView', {
        isAuthenticated: !!session?.user,
        userId: session?.user?.id
      });
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Generate dates for the week view
  useEffect(() => {
    const generateDates = () => {
      console.log(`🗓️ Generating dates for ${viewMode} view`);
      let dates: Date[] = [];
      
      if (viewMode === 'week') {
        // Generate all days in the week
        const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        dates = eachDayOfInterval({ start: weekStart, end: weekEnd });
        console.log(`📅 Week view - showing ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);
      } else if (viewMode === 'month') {
        // Generate all days in the month
        const monthStart = startOfMonth(currentWeekStart);
        const monthEnd = endOfMonth(currentWeekStart);
        dates = eachDayOfInterval({ start: monthStart, end: monthEnd });
        console.log(`📅 Month view - showing ${format(monthStart, 'yyyy-MM-dd')} to ${format(monthEnd, 'yyyy-MM-dd')}`);
      }
      
      setDisplayDates(dates);
      console.log(`🗓️ Generated ${dates.length} dates for ${viewMode} view`);
    };
    
    generateDates();
  }, [currentWeekStart, viewMode]);

  // Fetch goals and habits when component mounts or dates change
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      
      try {
        logEvent(LogCategory.HABITS, `Fetching goals and habits for ${viewMode} view`);
        const timer = createTimer(LogCategory.HABITS, 'Goals and habits fetch');
        
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          logError(LogCategory.AUTH, 'Authentication error in WeekView', { 
            error: userError?.message 
          });
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }
        
        logDebug(LogCategory.AUTH, 'User authenticated', { userId: user.id });
        
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
        
        logDebug(LogCategory.DB, 'Goals fetched', { count: goalsData?.length || 0 });
        console.log(`📊 Fetched ${goalsData?.length || 0} goals from database`);
        
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
        
        console.log(`📊 Fetched ${habitsData?.length || 0} habits from database`);
        
        // Track habit names globally to prevent duplicates across goals
        const globalHabitNames = new Map<string, Habit>();
        const uniqueHabits: Habit[] = [];
        
        habitsData?.forEach(habit => {
          if (!globalHabitNames.has(habit.name)) {
            globalHabitNames.set(habit.name, habit);
            uniqueHabits.push(habit);
          } else {
            console.log(`🔄 Found duplicate habit: ${habit.name}, ID: ${habit.id}, using ID: ${globalHabitNames.get(habit.name)?.id}`);
          }
        });
        
        logDebug(LogCategory.DB, 'Habits fetched', { 
          totalCount: habitsData?.length || 0,
          uniqueCount: uniqueHabits.length
        });
        
        console.log(`🔍 Filtered ${habitsData?.length || 0} habits to ${uniqueHabits.length} unique habits by name`);
        
        // Create a mapping of goal ID to goal for faster lookups
        const goalMap = new Map();
        goalsData?.forEach(goal => goalMap.set(goal.id, { ...goal, habits: [] }));
        
        // Check for duplicate goal names in the raw data from database
        const goalNameCounts = new Map<string, number>();
        const goalNameToIds = new Map<string, string[]>();
        
        goalsData?.forEach(goal => {
          const count = goalNameCounts.get(goal.goal) || 0;
          goalNameCounts.set(goal.goal, count + 1);
          
          const ids = goalNameToIds.get(goal.goal) || [];
          ids.push(goal.id);
          goalNameToIds.set(goal.goal, ids);
        });
        
        // Log duplicate goals
        console.log(`🔍 Goal name duplication check:`);
        goalNameCounts.forEach((count, name) => {
          if (count > 1) {
            console.log(`⚠️ Found ${count} goals with name "${name}" - IDs: ${goalNameToIds.get(name)?.join(", ")}`);
          }
        });
        
        // Assign habits to goals, ensuring no duplicates within a goal
        uniqueHabits.forEach(habit => {
          const goalId = habit.goal_id;
          const goal = goalMap.get(goalId);
          if (goal) {
            // Log which habit is being assigned to which goal
            console.log(`🔗 Assigning habit "${habit.name}" (ID: ${habit.id}) to goal "${goal.goal}" (ID: ${goalId})`);
            
            // Only add if this habit name doesn't already exist in this goal
            if (!goal.habits.some((h: Habit) => h.name === habit.name)) {
              goal.habits.push(habit);
            } else {
              console.log(`⚠️ Skipping duplicate habit "${habit.name}" for goal "${goal.goal}"`);
            }
          } else {
            console.log(`❌ Goal with ID ${goalId} not found for habit "${habit.name}" (${habit.id})`);
          }
        });
        
        // Convert the map to an array for state
        const mappedGoals = Array.from(goalMap.values());
        
        console.log(`📊 Final processed goals (${mappedGoals.length}):`);
        mappedGoals.forEach((goal: DbGoal) => {
          console.log(`  - Goal: ${goal.goal} (ID: ${goal.id}) with ${goal.habits.length} habits`);
          goal.habits.forEach((habit: Habit) => {
            console.log(`      - Habit: ${habit.name} (ID: ${habit.id})`);
          });
        });
        
        setGoals(mappedGoals);
        
        // Fetch habit completions for the displayed date range
        if (displayDates.length > 0) {
          await fetchCompletions(user.id);
        }
        
        timer.stop({
          goalsCount: goalsData?.length || 0,
          habitsCount: uniqueHabits.length || 0
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

    if (displayDates.length > 0) {
      fetchGoals();
    }
  }, [displayDates]);

  const fetchCompletions = async (userId: string) => {
    if (displayDates.length === 0) {
      logError(LogCategory.HABITS, 'Cannot fetch completions: no dates available');
      return;
    }
    
    console.log(`🔄 fetchCompletions called for user ${userId} in week view`);
    
    try {
      // Determine the date range for week view
      const startDate = displayDates[0];
      const endDate = displayDates[displayDates.length - 1];
      
      console.log(`📅 Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      
      logDebug(LogCategory.HABITS, `Fetching habit completions for week view`, {
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
        console.log(`❌ Error fetching completions: ${error.message}`);
        logError(LogCategory.DB, 'Error fetching completions', { error: error.message });
        return;
      }
      
      console.log(`✅ Successfully fetched completions:`, data);
      if (data && data.length > 0) {
        data.forEach((completion, i) => {
          console.log(`  Completion ${i+1}:`, { 
            id: completion.id, 
            habit_id: completion.habit_id, 
            date: completion.completed_date, 
            status: completion.status 
          });
        });
      } else {
        console.log(`ℹ️ No completions found in this date range`);
      }
      
      // Update completions state
      console.log(`🔄 Updating completions state with ${data?.length || 0} records`);
      setCompletions(data || []);
      
      // Also update habitCompletions derived state for faster lookups
      console.log(`🔄 Updating habitCompletions lookup state`);
      const completionsMap: Record<string, 'completed' | null> = {};
      
      if (data) {
        data.forEach(completion => {
          const key = `${completion.habit_id}-${completion.completed_date}`;
          completionsMap[key] = completion.status;
          console.log(`  Setting key "${key}" to "${completion.status}"`);
        });
      }
      
      setHabitCompletions(completionsMap);
      console.log(`✅ Completions state update finished`);
      
    } catch (err) {
      console.log(`❌ Exception in fetchCompletions: ${err}`);
      logError(LogCategory.SYSTEM, 'Error in fetchCompletions', { 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  // Handle habit completion toggling for current day only
  const handleHabitCompletion = async (habitId: string, date: Date) => {
    // Format the date for storage and display
    const dateStr = format(date, 'yyyy-MM-dd');
    const processingKey = `${habitId}-${dateStr}`;
    
    // Only allow completion for the current day
    if (!isSameDay(date, today)) {
      console.log(`🚫 Cannot complete habit for day other than today: ${dateStr}`);
      return;
    }
    
    console.log(`🔍 CLICK DETECTED: Toggling habit ${habitId} for date ${dateStr}`);
    logEvent(LogCategory.HABITS, 'Habit completion toggled', { 
      habitId, 
      date: dateStr,
      authenticated: !!user
    });
    
    // Start processing - show visual feedback
    console.log(`⏳ Setting processing state for ${processingKey} to true`);
    setProcessingHabits(prev => {
      const newState = { ...prev, [processingKey]: true };
      console.log(`⚙️ New processing state:`, newState);
      return newState;
    });
    
    try {
      // Check if user is authenticated
      if (!user) {
        console.log(`❌ User not authenticated`);
        logError(LogCategory.HABITS, 'User not authenticated for habit completion', {
          habitId, date: dateStr
        });
        setError("You must be signed in to track habits");
        return;
      }

      // Find completion status in state
      const key = `${habitId}-${dateStr}`;
      const currentStatus = habitCompletions[key] || null;
      
      // Toggle between completed and not completed
      const newStatus = currentStatus === 'completed' ? null : 'completed';
      console.log(`🔄 Toggling status from "${currentStatus}" to "${newStatus}"`);
      
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
          console.log(`❌ Error marking habit completed: ${insertError.message}`);
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
          console.log(`❌ Error unmarking habit completion: ${deleteError.message}`);
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
      console.log(`❌ Unexpected exception: ${error}`);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      // Remove processing state
      setProcessingHabits(prev => ({
        ...prev,
        [processingKey]: false
      }));
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
    console.log(`🖌️ Rendering week view for habit: ${habit.name}`);
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
                      <Check className="w-6 h-6 text-green-600" />
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
        console.log(`⚠️ Skipping duplicate goal: ${goal.goal} (ID: ${goal.id}) in week view`);
        return null;
      }
      
      // Mark this goal name as rendered
      renderedGoalNames.set(goal.goal, true);
      console.log(`🎯 Rendering goal: ${goal.goal} (ID: ${goal.id}) in week view`);
      
      // Filter out duplicate habits
      const renderedHabits = new Map<string, boolean>();
      const uniqueHabits = goal.habits.filter(habit => {
        if (renderedHabits.has(habit.name)) {
          console.log(`⚠️ Filtering out duplicate habit: ${habit.name} (ID: ${habit.id}) in week view`);
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
    console.log(`⬅️ Navigating to previous ${viewMode}`);
    if (viewMode === 'week') {
      setCurrentWeekStart(prev => subWeeks(prev, 1));
    } else if (viewMode === 'month') {
      setCurrentWeekStart(prev => subWeeks(prev, 4)); // Roughly one month
    }
  };

  const navigateNext = () => {
    console.log(`➡️ Navigating to next ${viewMode}`);
    if (viewMode === 'week') {
      setCurrentWeekStart(prev => addWeeks(prev, 1));
    } else if (viewMode === 'month') {
      setCurrentWeekStart(prev => addWeeks(prev, 4)); // Roughly one month
    }
  };

  // Toggle between week and month view
  const toggleViewMode = () => {
    setViewMode(prevMode => (prevMode === 'week' ? 'month' : 'week'));
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

      {/* View mode toggle */}
      <button
        onClick={toggleViewMode}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Switch to {viewMode === 'week' ? 'Month' : 'Week'} View
      </button>

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

      {/* Debug section in development only */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Current Data:</p>
          <p className="text-xs text-gray-500">
            {viewMode === 'week'
              ? `Week: ${format(displayDates[0], 'yyyy-MM-dd')} - ${format(displayDates[displayDates.length - 1], 'yyyy-MM-dd')}`
              : `Month: ${format(currentWeekStart, 'MMMM yyyy')}`}
          </p>
          <p className="text-xs text-gray-500">Goals: {goals.length}</p>
          <p className="text-xs text-gray-500">Completions: {completions.length}</p>
        </div>
      )}
    </div>
  );
};

export default WeekView;
