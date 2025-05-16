import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  getDaysInMonth, 
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
  differenceInDays
} from 'date-fns';
import { logEvent, logDebug, logError, createTimer, LogCategory } from '../../lib/logger';
import { getRandomQuote } from '../../lib/motivationalQuotes';
import confetti from 'canvas-confetti';

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

interface WeekViewProps {
  viewMode?: 'day' | 'week' | 'month' | 'year';
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

const WeekView: React.FC<WeekViewProps> = ({ viewMode = 'week' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [currentYear, setCurrentYear] = useState(() => startOfYear(new Date()));
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingHabits, setProcessingHabits] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, 'completed' | null>>({});
  const [user, setUser] = useState<User | null>(null);

  console.log(`📊 Current view mode: ${viewMode}`);

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

  // Generate dates based on view mode
  useEffect(() => {
    const generateDates = () => {
      console.log(`🗓️ Generating dates for ${viewMode} view`);
      const dates: Date[] = [];
      
      switch(viewMode) {
        case 'day':
          // Just use the current date
          dates.push(currentDate);
          console.log(`📅 Day view - showing date: ${format(currentDate, 'yyyy-MM-dd')}`);
          break;
          
        case 'week': {
          // Generate 7 days for the week
          for (let i = 0; i < 7; i++) {
            dates.push(addDays(currentWeekStart, i));
          }
          console.log(`📅 Week view - showing week of ${format(currentWeekStart, 'yyyy-MM-dd')}`);
          break;
        }
          
        case 'month': {
          // Generate all days in the month
          const daysInMonth = getDaysInMonth(currentMonth);
          const monthStart = startOfMonth(currentMonth);
          for (let i = 0; i < daysInMonth; i++) {
            dates.push(addDays(monthStart, i));
          }
          console.log(`📅 Month view - showing ${format(currentMonth, 'MMMM yyyy')} with ${daysInMonth} days`);
          break;
        }
          
        case 'year': {
          // Generate all days in the year
          const yearStart = startOfYear(currentYear);
          // Calculate days in the year (handle leap years)
          const daysInYear = differenceInDays(endOfYear(currentYear), yearStart) + 1;
          console.log(`📅 Year view - showing ${format(currentYear, 'yyyy')} with ${daysInYear} days`);
          
          // Add all days of the year
          for (let i = 0; i < daysInYear; i++) {
            dates.push(addDays(yearStart, i));
          }
          break;
        }
      }
      
      setDisplayDates(dates);
      console.log(`🗓️ Generated ${dates.length} dates for ${viewMode} view`);
    };
    
    generateDates();
  }, [viewMode, currentDate, currentWeekStart, currentMonth, currentYear]);

  // Get current date for highlighting today
  const today = new Date();

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
        setUser(user);
        
        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id);

        if (goalsError) {
          logError(LogCategory.DB, 'Error fetching goals', { error: goalsError.message });
          console.error('Error fetching goals:', goalsError);
          setError('Could not fetch goals. Please try again.');
          setLoading(false);
          return;
        }
        
        logDebug(LogCategory.DB, 'Goals fetched', { count: goalsData?.length || 0 });
        console.log(`📊 Fetched ${goalsData?.length || 0} goals from database`);
        
        // Log all goals with their IDs for debugging
        console.log('Goals fetched:');
        goalsData?.forEach(goal => {
          console.log(`  - Goal ID: ${goal.id}, Name: ${goal.goal}`);
        });
        
        // Fetch habits
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);
        
        if (habitsError) {
          logError(LogCategory.DB, 'Error fetching habits', { error: habitsError.message });
          console.error('Error fetching habits:', habitsError);
          setError('Could not fetch habits. Please try again.');
          setLoading(false);
          return;
        }
        
        console.log(`📊 Fetched ${habitsData?.length || 0} habits from database`);
        
        // Log all habits with their IDs and goal IDs for debugging
        console.log('All habits fetched:');
        habitsData?.forEach((habit: DbHabit) => {
          console.log(`  - Habit ID: ${habit.id}, Name: ${habit.name}, Goal ID: ${habit.goal_id || 'unassigned'}`);
        });
        
        // If no habits found, check localStorage for offline mode data
        if (!habitsData || habitsData.length === 0) {
          console.log('No habits found in database, checking localStorage for offline data...');
          
          const localHabitsStr = localStorage.getItem('localHabits');
          if (localHabitsStr) {
            console.log('Found locally stored habits, using them instead');
            try {
              const localHabitsData = JSON.parse(localHabitsStr);
              
              // Create goals from local data
              const localGoals: Goal[] = localHabitsData.map((goalHabit: any) => {
                return {
                  id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  goal: goalHabit.goal,
                  habits: goalHabit.habits.map((h: any) => ({
                    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    name: h.name,
                    description: h.description || '',
                    goal_id: `local-goal-${goalHabit.goal}`,
                    icon: h.icon
                  }))
                };
              });
              
              setGoals(localGoals);
              console.log(`📊 Loaded ${localGoals.length} goals with ${localGoals.reduce((total, g) => total + g.habits.length, 0)} habits from localStorage`);
              
              // Fetch completions for these habits
              await fetchCompletions(user.id);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Error parsing local habits:', e);
            }
          }
        }
        
        // If we have both goals and habits data, organize them
        if (goalsData && habitsData) {
          // Create a map of goals with their habits
          const goalsMap: { [key: string]: Goal } = {};
          
          // Initialize goals
          goalsData.forEach((goal: DbGoal) => {
            goalsMap[goal.id] = {
              id: goal.id,
              goal: goal.goal,
              habits: []
            };
          });
          
          // Add unassigned goals category for habits without goal_id
          goalsMap['unassigned'] = {
            id: 'unassigned',
            goal: 'Other Habits',
            habits: []
          };
          
          // Assign habits to their goals
          habitsData.forEach((habit: DbHabit) => {
            const goalId = habit.goal_id || 'unassigned';
            
            // If goal exists, add habit to it
            if (goalsMap[goalId]) {
              goalsMap[goalId].habits.push({
                id: habit.id,
                name: habit.name,
                description: habit.description || '',
                goal_id: goalId,
                icon: habit.icon
              });
            } else {
              // If goal doesn't exist, add to unassigned category
              console.log(`Habit "${habit.name}" has goal_id ${goalId} which doesn't exist, adding to unassigned`);
              goalsMap['unassigned'].habits.push({
                id: habit.id,
                name: habit.name,
                description: habit.description || '',
                goal_id: 'unassigned',
                icon: habit.icon
              });
            }
          });
          
          // Convert map to array and filter out empty goals
          const organizedGoals = Object.values(goalsMap)
            .filter(goal => goal.habits.length > 0);
          
          console.log(`📊 Organized ${organizedGoals.length} goals with habits`);
          organizedGoals.forEach(goal => {
            console.log(`  - Goal "${goal.goal}" has ${goal.habits.length} habits`);
          });
          
          setGoals(organizedGoals);
        } else {
          console.log('No goals or habits data available');
          setGoals([]);
        }
        
        timer.end();
        // Fetch completions
        await fetchCompletions(user.id);
      } catch (err) {
        logError(LogCategory.HABITS, 'Exception in fetchGoals', { error: String(err) });
        console.error('Error fetching goals and habits:', err);
        setError('An error occurred while loading your data.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchGoals();
    }
  }, [user, viewMode]);

  const fetchCompletions = async (userId: string) => {
    if (displayDates.length === 0) {
      logError(LogCategory.HABITS, 'Cannot fetch completions: no dates available');
      return;
    }
    
    console.log(`🔄 fetchCompletions called for user ${userId} in ${viewMode} view`);
    
    try {
      // Determine the date range based on view mode
      let startDate, endDate;
      
      switch(viewMode) {
        case 'day':
          startDate = currentDate;
          endDate = currentDate;
          break;
          
        case 'week':
          startDate = currentWeekStart;
          endDate = addDays(currentWeekStart, 6);
          break;
          
        case 'month':
          startDate = startOfMonth(currentMonth);
          endDate = endOfMonth(currentMonth);
          break;
          
        case 'year':
          startDate = startOfYear(currentYear);
          endDate = endOfYear(currentYear);
          break;
      }
      
      console.log(`📅 Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      
      logDebug(LogCategory.HABITS, `Fetching habit completions for ${viewMode} view`, {
        weekStart: format(startDate, 'yyyy-MM-dd'),
        weekEnd: format(endDate, 'yyyy-MM-dd')
      });
      
      console.log(`📝 Supabase query parameters:`, {
        user_id: userId,
        from_date: format(startDate, 'yyyy-MM-dd'),
        to_date: format(endDate, 'yyyy-MM-dd')
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
      
      logDebug(LogCategory.HABITS, 'Habit completions fetched', { 
        count: data?.length || 0,
        firstCompletion: data && data.length > 0 ? data[0] : null
      });
      
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

  /**
   * Handle habit completion toggling
   * 
   * This function manages the habit completion process when a user clicks a checkbox.
   */
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
    
    // Get the target checkbox element
    const targetBox = document.getElementById(`habit-${habitId}-${dateStr}`);
    console.log(`🎯 Target element found: ${!!targetBox}`, targetBox);
    
    // Start processing - show visual feedback
    console.log(`⏳ Setting processing state for ${processingKey} to true`);
    setProcessingHabits(prev => {
      const newState = { ...prev, [processingKey]: true };
      console.log(`⚙️ New processing state:`, newState);
      return newState;
    });
    
    if (targetBox) {
      console.log(`🔄 Adding opacity-50 class to target element`);
      targetBox.classList.add('opacity-50');
    }
    
    try {
      // First check if the user is authenticated
      console.log(`🔐 Checking user authentication: ${!!user}`);
      if (!user) {
        console.log(`❌ User not authenticated`);
        logError(LogCategory.HABITS, 'User not authenticated for habit completion', {
          habitId, date: dateStr
        });
        setError("You must be signed in to track habits");
        
        // Remove processing state
        setProcessingHabits(prev => ({
          ...prev,
          [processingKey]: false
        }));
        
        // Remove visual feedback
        if (targetBox) {
          targetBox.classList.remove('opacity-50');
        }
        
        return;
      }
      console.log(`✅ User authenticated: ID=${user.id}`);

      // Find completion status in state
      const key = `${habitId}-${dateStr}`;
      const currentStatus = habitCompletions[key] || null;
      console.log(`📊 Current completion status: "${currentStatus}" for key ${key}`);
      
      // Find habit info for the given habit ID
      console.log(`🔍 Finding habit info for ID ${habitId}`);
      let habitInfo = null;
      for (const goal of goals) {
        console.log(`  👀 Checking goal: ${goal.goal} (${goal.id})`);
        console.log(`  👀 Goal has ${goal.habits.length} habits`);
        for (const habit of goal.habits) {
          console.log(`    - Habit: ${habit.name} (ID: ${habit.id})`);
        }
        const habit = goal.habits.find(h => h.id === habitId);
        if (habit) {
          console.log(`  ✅ Habit found in goal "${goal.goal}": ${habit.name}`);
          habitInfo = { habit, goal };
          break;
        }
      }
      
      logDebug(LogCategory.HABITS, 'Habit completion current status', {
        habitId,
        date: dateStr,
        currentStatus,
        habitInfo: habitInfo ? {
          habitName: habitInfo.habit.name,
          goalName: habitInfo.goal.goal
        } : null
      });
      
      if (!habitInfo) {
        console.log(`❌ Habit info not found for ID ${habitId}`);
        logError(LogCategory.HABITS, 'Cannot find habit information', { habitId });
        setError("Invalid habit ID. Please refresh the page.");
        
        // Remove processing state
        setProcessingHabits(prev => ({
          ...prev,
          [processingKey]: false
        }));
        
        // Remove visual feedback
        if (targetBox) {
          targetBox.classList.remove('opacity-50');
        }
        
        return;
      }
      
      // If this is a placeholder habit ID, create the actual habit in the database
      if (habitId.startsWith('placeholder-') || habitId.startsWith('habit-')) {
        console.log(`🆕 Creating real habit from placeholder ${habitId}`);
        logEvent(LogCategory.HABITS, 'Creating real habit from placeholder', {
          habitId,
          habitName: habitInfo.habit.name,
          goalName: habitInfo.goal.goal
        });
        
        try {
          // Create the habit in the database
          console.log(`📝 Inserting new habit into database:`, {
            name: habitInfo.habit.name,
            description: habitInfo.habit.description,
            goal_id: habitInfo.goal.id,
            user_id: user.id
          });
          
          const { data: newHabit, error: habitError } = await supabase
            .from('habits')
            .insert({
              name: habitInfo.habit.name,
              description: habitInfo.habit.description,
              goal_id: habitInfo.goal.id,
              created_at: new Date().toISOString(),
              user_id: user.id
            })
            .select()
            .single();
          
          if (habitError) {
            console.log(`❌ Error creating habit: ${habitError.message}`);
            logError(LogCategory.HABITS, 'Error creating habit from placeholder', {
              error: habitError.message,
              habitId,
              habitName: habitInfo.habit.name
            });
            setError("Failed to create habit. Please try again.");
            
            // Remove processing state
            setProcessingHabits(prev => ({
              ...prev,
              [processingKey]: false
            }));
            
            // Remove visual feedback
            if (targetBox) {
              targetBox.classList.remove('opacity-50');
            }
            
            return;
          }
          
          console.log(`✅ Habit created successfully:`, newHabit);
          logEvent(LogCategory.HABITS, 'Created real habit in database', {
            oldId: habitId,
            newId: newHabit.id,
            habitName: newHabit.name
          });
          
          // Update the habitId to use the new real ID
          console.log(`🔄 Updating habit ID from ${habitId} to ${newHabit.id}`);
          habitId = newHabit.id;
          
          // Update goals data structure with the new habit ID
          console.log(`🔄 Updating goals data structure with new habit ID`);
          const updatedGoals = goals.map(g => {
            if (g.id === habitInfo.goal.id) {
              return {
                ...g,
                habits: g.habits.map(h => 
                  h.id === habitInfo.habit.id ? { ...h, id: newHabit.id } : h
                )
              };
            }
            return g;
          });
          
          setGoals(updatedGoals);
        } catch (createError) {
          console.log(`❌ Exception creating habit: ${createError}`);
          logError(LogCategory.HABITS, 'Failed to create habit', { 
            error: createError instanceof Error ? createError.message : String(createError),
            habitId
          });
          setError("Could not create habit. Please try again.");
          
          // Remove processing state
          setProcessingHabits(prev => ({
            ...prev,
            [processingKey]: false
          }));
          
          // Remove visual feedback
          if (targetBox) {
            targetBox.classList.remove('opacity-50');
          }
          
          return;
        }
      }
      
      // Toggle between completed and not completed
      const newStatus = currentStatus === 'completed' ? null : 'completed';
      console.log(`🔄 Toggling status from "${currentStatus}" to "${newStatus}"`);
      logDebug(LogCategory.HABITS, 'Setting new status', { 
        habitId, 
        date: dateStr, 
        oldStatus: currentStatus, 
        newStatus 
      });
      
      // Update local state immediately for UI responsiveness
      console.log(`🔄 Updating local state (habitCompletions) with new status`);
      setHabitCompletions(prev => {
        const newState = { ...prev, [key]: newStatus as 'completed' | null };
        console.log(`⚙️ New habit completions state:`, newState);
        return newState;
      });
      
      // Perform database update
      if (newStatus === 'completed') {
        console.log(`📝 Marking habit as completed in database`);
        logEvent(LogCategory.HABITS, 'Marking habit as completed', { habitId, date: dateStr });
        
        // Insert completion record
        console.log(`📝 Upserting completion record:`, {
          habit_id: habitId,
          user_id: user.id,
          completed_date: dateStr,
          status: 'completed'
        });
        
        const { data: insertData, error: insertError } = await supabase
          .from('habit_completions')
          .upsert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: dateStr,
            status: 'completed'
          })
          .select();
          
        if (insertError) {
          console.log(`❌ Error marking habit completed: ${insertError.message}`);
          logError(LogCategory.HABITS, 'Error marking habit completed', { 
            error: insertError.message,
            habitId,
            date: dateStr
          });
          
          // Revert the local state
          console.log(`🔄 Reverting local state due to error`);
          setHabitCompletions(prev => ({
            ...prev,
            [key]: currentStatus
          }));
          
          setError("Error: Failed to update habit. Please try again.");
        } else {
          console.log(`✅ Habit marked as completed successfully:`, insertData);
          logEvent(LogCategory.HABITS, 'Habit marked as completed in database', { 
            habitId, 
            date: dateStr,
            completionId: insertData?.[0]?.id
          });
          
          // Trigger celebration effects
          triggerCelebration();
          
          // Show motivational quote
          const quote = getRandomQuote();
          const toastId = `toast-${Date.now()}`;
          
          // Create and show the toast
          const toast = document.createElement('div');
          toast.id = toastId;
          toast.className = 'fixed bottom-4 right-4 bg-white/90 backdrop-blur-md px-6 py-4 rounded-xl shadow-xl transform translate-y-full opacity-0 transition-all duration-500 z-50';
          toast.innerHTML = `
            <div class="text-lg font-medium text-gray-800 mb-1">Great job! 🎉</div>
            <div class="text-gray-600">${quote}</div>
          `;
          document.body.appendChild(toast);
          
          // Animate the toast in
          setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
          }, 100);
          
          // Remove the toast after 5 seconds
          setTimeout(() => {
            toast.style.transform = 'translateY(full)';
            toast.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 500);
          }, 5000);
          
          // Refresh completions
          console.log(`🔄 Refreshing completions data`);
          fetchCompletions(user.id);
        }
      } else {
        console.log(`📝 Unmarking habit completion in database`);
        logEvent(LogCategory.HABITS, 'Unmarking habit completion', { habitId, date: dateStr });
        
        // Delete completion record
        console.log(`🗑️ Deleting completion record for habit_id=${habitId}, date=${dateStr}`);
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
          logError(LogCategory.HABITS, 'Error unmarking habit completion', { 
            error: deleteError.message,
            habitId,
            date: dateStr
          });
          
          // Revert the local state
          console.log(`🔄 Reverting local state due to error`);
          setHabitCompletions(prev => ({
            ...prev,
            [key]: currentStatus
          }));
          
          setError("Error: Failed to update habit. Please try again.");
        } else {
          console.log(`✅ Habit unmarked successfully`);
          logEvent(LogCategory.HABITS, 'Habit unmarked in database', { 
            habitId, 
            date: dateStr 
          });
          
          // Refresh completions
          console.log(`🔄 Refreshing completions data`);
          fetchCompletions(user.id);
        }
      }
    } catch (error) {
      console.log(`❌ Unexpected exception: ${error}`);
      logError(LogCategory.HABITS, 'Exception handling habit completion', { 
        error: error instanceof Error ? error.message : String(error),
        habitId,
        date: dateStr
      });
      
      setError("An unexpected error occurred. Please try again.");
    } finally {
      // Remove processing state
      console.log(`🔄 Resetting processing state for ${processingKey} to false`);
      setProcessingHabits(prev => ({
        ...prev,
        [processingKey]: false
      }));
      
      // Remove visual feedback
      if (targetBox) {
        console.log(`🔄 Removing opacity-50 class from target element`);
        targetBox.classList.remove('opacity-50');
      }
      console.log(`✅ Habit completion toggle operation completed`);
    }
  };

  const getCompletionStatus = (habitId: string, date: Date): 'completed' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check database completions
    const completion = completions.find(
      c => c.habit_id === habitId && c.completed_date === dateStr
    );
    
    console.log(`🔍 getCompletionStatus for habit=${habitId}, date=${dateStr}:`, { 
      found: !!completion, 
      status: completion?.status,
      allCompletions: completions.length
    });
    
    return completion?.status || null;
  };

  const renderCompletionButton = (habitId: string, date: Date) => {
    const status = getCompletionStatus(habitId, date);
    const isCurrentDay = isSameDay(date, today);
    const dateStr = format(date, 'yyyy-MM-dd');
    const processingKey = `${habitId}-${dateStr}`;
    const isProcessing = processingHabits[processingKey] || false;
    
    console.log(`🎨 Rendering button for habit=${habitId}, date=${dateStr}:`, { 
      status, 
      isCurrentDay, 
      isProcessing 
    });

    return (
      <button
        id={`habit-${habitId}-${dateStr}`}
        data-habit-id={habitId}
        data-date={dateStr}
        onClick={() => {
          console.log(`👆 Button clicked for habit=${habitId}, date=${dateStr}`);
          if (!isCurrentDay) {
            console.log(`🚫 Cannot complete habit for non-current day: ${dateStr}`);
            return;
          }
          handleHabitCompletion(habitId, date);
        }}
        disabled={isProcessing || (!isCurrentDay && status !== 'completed')}
        className={`w-full h-full rounded-xl transition-all duration-300 transform
          ${status === 'completed' 
            ? 'bg-green-500 text-white hover:bg-green-600 scale-105' 
            : isCurrentDay
              ? 'bg-white border-2 border-red-500 hover:bg-red-50 hover:scale-105'
              : 'bg-gray-100 border-2 border-gray-200 opacity-50'
          }
          ${isProcessing ? 'animate-pulse cursor-wait' : ''}
          ${!isCurrentDay && status !== 'completed' ? 'cursor-not-allowed' : ''}
          shadow-sm hover:shadow-md
        `}
        aria-label={isCurrentDay ? (status === 'completed' ? 'Mark as incomplete' : 'Mark as complete') : 'Cannot complete for this day'}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
        ) : status === 'completed' ? (
          <Check className="w-6 h-6 mx-auto" />
        ) : null}
      </button>
    );
  };

  // Function to render habits for a goal based on view mode
  const renderGoalHabits = (goal: Goal) => {
    logDebug(LogCategory.HABITS, `Rendering habits for goal in ${viewMode} view`, { 
      goalId: goal.id, 
      goalName: goal.goal, 
      habitsCount: goal.habits.length 
    });
    
    console.log(`🏁 RENDERING GOAL HABITS for goal: ${goal.goal} (${goal.id}) in ${viewMode} view with ${goal.habits.length} habits`);
    
    if (goal.habits.length === 0) {
      return (
        <div className="mt-2 text-gray-500 italic">
          No habits for this goal yet.
        </div>
      );
    }

    // Create a map to track habits we've already rendered to prevent duplicates
    const renderedHabits = new Map<string, boolean>();
    
    // Filter out duplicate habits
    const uniqueHabits = goal.habits.filter(habit => {
      if (renderedHabits.has(habit.name)) {
        console.log(`⚠️ Filtering out duplicate habit: ${habit.name} (ID: ${habit.id}) in ${viewMode} view`);
        return false;
      }
      renderedHabits.set(habit.name, true);
      return true;
    });
    
    console.log(`Rendering ${uniqueHabits.length} unique habits for goal "${goal.goal}" after filtering`);
    
    return (
      <div className="space-y-6">
        {uniqueHabits.map((habit) => {
          console.log(`✅ Rendering habit: ${habit.name} (ID: ${habit.id}) for goal ${goal.goal}`);
          
          return (
            <div key={habit.id} className="space-y-2">
              {renderHabitCompletions(habit)}
            </div>
          );
        })}
      </div>
    );
  };

  // Function to render the completion grid based on view mode
  const renderHabitCompletions = (habit: Habit) => {
    switch(viewMode) {
      case 'day':
        return renderDayView(habit);
      case 'week':
        return renderWeekView(habit);
      case 'month':
        return renderMonthView(habit);
      case 'year':
        // This is now handled by the YearView component
        console.log("Year view should be handled by YearView component");
        return <div>Year view is handled separately</div>;
      default:
        return renderWeekView(habit);
    }
  };

  // Render a single day view
  const renderDayView = (habit: Habit) => {
    console.log(`🖌️ Rendering day view for habit: ${habit.name}`);
    
    return (
      <div className="mt-2">
        <div className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{habit.icon || '🎯'}</span>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{habit.name}</h4>
              {habit.description && (
                <p className="text-sm text-gray-500">{habit.description}</p>
              )}
            </div>
            <div className="w-12 h-12 ml-4">
              {renderCompletionButton(habit.id, currentDate)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render a week view (7 days)
  const renderWeekView = (habit: Habit) => {
    console.log(`🖌️ Rendering week view for habit: ${habit.name}`);
    
    return (
      <div>
        {renderHabitForNonYearView(habit)}
        <div className="grid grid-cols-7 gap-4">
          {displayDates.map((date, index) => (
            <div key={index} className="w-full h-14">
              {renderCompletionButton(habit.id, date)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a month view (all days in month)
  const renderMonthView = (habit: Habit) => {
    console.log(`🖌️ Rendering month view for habit: ${habit.name}`);
    
    return (
      <div>
        {renderHabitForNonYearView(habit)}
        <div className="grid grid-cols-7 gap-2">
          {displayDates.map((date, index) => (
            <div key={index} className="w-full h-8">
              {renderCompletionButton(habit.id, date)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to delete a habit - used by day/week/month views
  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) {
      return;
    }
    
    try {
      console.log(`Deleting habit with ID: ${habitId}`);
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
        
      if (error) {
        console.error('Error deleting habit:', error);
        return;
      }
      
      // Update goals state to remove the deleted habit
      setGoals(prevGoals => {
        return prevGoals.map(goal => ({
          ...goal,
          habits: goal.habits.filter(h => h.id !== habitId)
        }));
      });
      
      console.log('Habit deleted successfully');
    } catch (err) {
      console.error('Unexpected error deleting habit:', err);
    }
  };

  // Function to render a habit in day, week, or month view
  const renderHabitForNonYearView = (habit: Habit) => {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{habit.icon || '🎯'}</span>
          <span className="text-gray-900">{habit.name}</span>
        </div>
        <button 
          onClick={() => deleteHabit(habit.id)}
          className="text-xs text-red-600 hover:text-red-800 ml-2 p-1"
          title="Delete habit"
        >
          Delete
        </button>
      </div>
    );
  };

  // Function to delete a goal
  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal and all its habits?')) {
      return;
    }
    
    try {
      // First, delete all habits associated with this goal
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        console.error(`Goal with ID ${goalId} not found`);
        return;
      }
      
      console.log(`Deleting goal "${goal.goal}" (ID: ${goalId}) and its ${goal.habits.length} habits`);
      
      // Delete the habits
      for (const habit of goal.habits) {
        console.log(`Deleting habit "${habit.name}" (ID: ${habit.id})`);
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', habit.id);
          
        if (error) {
          console.error(`Error deleting habit ${habit.id}:`, error);
        }
      }
      
      // Then delete the goal
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);
        
      if (error) {
        console.error(`Error deleting goal ${goalId}:`, error);
        return;
      }
      
      // Update the goals state
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      
      console.log(`Goal ${goalId} deleted successfully`);
    } catch (err) {
      console.error('Unexpected error deleting goal:', err);
    }
  };
  
  // Function to clean up duplicate goals
  const cleanupDuplicateGoals = async () => {
    if (!user) {
      setError("You must be signed in to cleanup duplicate goals");
      return;
    }
    
    if (!confirm('This will delete duplicate goals. Each unique goal name will be kept, but duplicates will be removed. Continue?')) {
      return;
    }
    
    console.log("Starting duplicate goal cleanup...");
    
    try {
      // Group goals by name
      const goalsByName = new Map<string, Goal[]>();
      
      for (const goal of goals) {
        const existingGoals = goalsByName.get(goal.goal) || [];
        existingGoals.push(goal);
        goalsByName.set(goal.goal, existingGoals);
      }
      
      // For each group of goals with the same name, keep only the first one
      let deletedCount = 0;
      
      for (const [goalName, goalGroup] of goalsByName.entries()) {
        console.log(`Processing "${goalName}": found ${goalGroup.length} goals with this name`);
        
        if (goalGroup.length > 1) {
          // Keep the first goal, delete the rest
          const [keepGoal, ...duplicateGoals] = goalGroup;
          console.log(`Keeping goal ID: ${keepGoal.id}, deleting ${duplicateGoals.length} duplicates`);
          
          // Delete each duplicate goal
          for (const dupGoal of duplicateGoals) {
            await deleteGoal(dupGoal.id);
            deletedCount++;
          }
        }
      }
      
      console.log(`Cleanup complete. Deleted ${deletedCount} duplicate goals.`);
      alert(`Cleanup complete. Deleted ${deletedCount} duplicate goals.`);
      
      // Refresh the data
      const timer = setTimeout(() => {
        // Force a re-fetch by manipulating the displayDates slightly
        setDisplayDates(prev => [...prev]);
      }, 500);
      
      return () => clearTimeout(timer);
      
    } catch (err) {
      console.error("Error cleaning up duplicate goals:", err);
      setError("Error cleaning up duplicate goals. Please try again.");
    }
  };

  const renderTitle = () => {
    switch (viewMode) {
      case 'day':
        return (
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl text-gray-600">Day</h2>
            <h1 className="text-3xl font-bold text-red-500">
              {format(currentDate, 'do MMM')}
            </h1>
          </div>
        );
      case 'week':
        return (
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl text-gray-600">Week of</h2>
            <h1 className="text-3xl font-bold text-red-500">
              {format(currentWeekStart, 'do MMM')}
            </h1>
          </div>
        );
      case 'month':
        return (
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl text-gray-600">Month</h2>
            <h1 className="text-3xl font-bold text-red-500">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
          </div>
        );
      case 'year':
        return (
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl text-gray-600">Year</h2>
            <h1 className="text-3xl font-bold text-red-500">
              {format(currentYear, 'yyyy')}
            </h1>
          </div>
        );
      default:
        return (
        <div className="flex items-baseline space-x-2">
          <h2 className="text-xl text-gray-600">Week of</h2>
          <h1 className="text-3xl font-bold text-red-500">
            {format(currentWeekStart, 'do MMM')}
          </h1>
        </div>
        );
    }
  };

  // Render the days header according to view mode
  const renderDaysHeader = () => {
    switch(viewMode) {
      case 'day':
        return (
          <div className="py-2 text-center">
            <div className={`text-lg font-medium ${
              isSameDay(currentDate, today) ? 'text-red-500' : ''
            }`}>
              {format(currentDate, 'EEEE')}
        </div>
      </div>
        );

      case 'week':
        return (
      <div className="grid grid-cols-7 gap-4">
            {displayDates.map((date, index) => {
          const isCurrentDay = isSameDay(date, today);
          return (
            <div
              key={index}
              className={`text-center py-2 ${
                isCurrentDay ? 'bg-red-50 rounded-lg' : ''
              }`}
            >
              <div className={`text-sm font-medium ${
                isCurrentDay ? 'text-red-500' : 'text-gray-500'
              }`}>
                {format(date, 'EEE').toUpperCase()}
              </div>
              <div className={`text-lg ${
                isCurrentDay ? 'text-red-500 font-medium' : ''
              }`}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>
        );
        
      case 'month':
        return (
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={index} className="text-xs font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>
        );
        
      case 'year':
        // Year view header is now handled by YearView component
        return null;
        
      default:
        return null;
    }
  };

  // Navigation methods for different views
  const navigatePrevious = () => {
    console.log(`⬅️ Navigating to previous ${viewMode}`);
    switch(viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'week':
        setCurrentWeekStart(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setCurrentMonth(prev => subMonths(prev, 1));
        break;
      case 'year':
        setCurrentYear(prev => subYears(prev, 1));
        break;
    }
  };

  const navigateNext = () => {
    console.log(`➡️ Navigating to next ${viewMode}`);
    switch(viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentWeekStart(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentMonth(prev => addMonths(prev, 1));
        break;
      case 'year':
        setCurrentYear(prev => addYears(prev, 1));
        break;
    }
  };

  const triggerCelebration = () => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
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
        {renderTitle()}
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Admin tools - only show in development or with query param */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Admin Tools</p>
          <div className="flex space-x-2 mt-2">
            <button 
              onClick={cleanupDuplicateGoals}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
            >
              Clean Up Duplicate Goals
            </button>
          </div>
        </div>
      </div>

      {/* Helper tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Habit Tracking Tip</p>
          <p>Click on the boxes beside each habit to mark them as complete. Green checkmarks indicate completed habits.</p>
          {viewMode === 'year' && (
            <p className="mt-1">Year view shows all 365 days. Current day is highlighted with a red ring.</p>
          )}
        </div>
      </div>

      {/* Days Header - only for week/month view */}
      {(viewMode === 'day' || viewMode === 'week' || viewMode === 'month') && renderDaysHeader()}

      {/* Habits Grid */}
      <div className="space-y-8">
        {goals.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No goals or habits found. Try adding some!
          </p>
        ) : (
          (() => {
            // Create a map to track which goal names we've already rendered
            const renderedGoalNames = new Map<string, boolean>();
            
            return goals.map((goal) => {
              // Skip this goal if we've already rendered one with the same name
              if (renderedGoalNames.has(goal.goal)) {
                console.log(`⚠️ Skipping duplicate goal: ${goal.goal} (ID: ${goal.id}) in ${viewMode} view`);
                return null;
              }
              
              // Mark this goal name as rendered
              renderedGoalNames.set(goal.goal, true);
              console.log(`🎯 Rendering goal: ${goal.goal} (ID: ${goal.id}) in ${viewMode} view`);
              
              return (
                <div key={goal.id} className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">{goal.goal}</h3>
                  {renderGoalHabits(goal)}
                </div>
              );
            }).filter(Boolean) // Filter out null values
          })()
        )}
      </div>

      {/* Debug section in development only */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Current Data:</p>
          <p className="text-xs text-gray-500">View Mode: {viewMode}</p>
          <p className="text-xs text-gray-500">Date Range: {displayDates.length > 0 && 
            `${format(displayDates[0], 'yyyy-MM-dd')} to ${format(displayDates[displayDates.length-1], 'yyyy-MM-dd')}`}
          </p>
          <p className="text-xs text-gray-500">Goals: {goals.length}</p>
          <p className="text-xs text-gray-500">Completions: {completions.length}</p>
          <p className="text-xs text-gray-500">Display Dates: {displayDates.length}</p>
        </div>
      )}
    </div>
  );
};

export default WeekView;