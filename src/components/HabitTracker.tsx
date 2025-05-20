
import React, { useState, useEffect } from 'react';
import WeekView from './views/WeekView';
import GoalsView from './views/GoalsView';
import ProgressView from './views/ProgressView';
import YearView from './views/YearView';
import AnalyticsView from './views/AnalyticsView';
import TabNavigation from './TabNavigation';
import { supabase } from '../lib/supabase';
import { logDebug, LogCategory } from '../lib/logger';

interface HabitTrackerProps {
  initialView?: 'habits' | 'goals' | 'areas' | 'progress' | 'settings';
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ initialView = 'habits' }) => {
  const [activeTab, setActiveTab] = useState<'habits' | 'goals' | 'areas' | 'progress' | 'settings'>(initialView);
  const [activeView, setActiveView] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [key, setKey] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Define state variables with underscore prefix to denote they're intentionally unused
  const [_habits, _setHabits] = useState<any[]>([]);
  const [_filteredHabits, _setFilteredHabits] = useState<any[]>([]);
  const [_loading, _setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in offline mode
    const offlineMode = localStorage.getItem('isOfflineMode') === 'true';
    setIsOfflineMode(offlineMode);
    
    if (offlineMode) {
      logDebug(LogCategory.UI, 'HabitTracker: Running in offline mode');
      loadLocalHabits();
    } else {
      // Regular Supabase data loading
      fetchHabits();
    }
  }, []);

  // Function to load habits from localStorage
  const loadLocalHabits = () => {
    try {
      const localHabitsStr = localStorage.getItem('localHabits');
      
      if (localHabitsStr) {
        const localHabitsData = JSON.parse(localHabitsStr);
        
        // Convert from GoalHabits[] format to flattened habits array
        const allHabits = [];
        
        for (const goalHabit of localHabitsData) {
          const goalName = goalHabit.goal;
          
          for (const habit of goalHabit.habits) {
            allHabits.push({
              id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: habit.name,
              description: habit.description,
              frequency: habit.frequency || 'daily',
              goal: goalName // Store goal name here for display
            });
          }
        }
        
        _setHabits(allHabits);
        _setFilteredHabits(allHabits);
        _setLoading(false);
      } else {
        logDebug(LogCategory.UI, 'No local habits found');
        _setHabits([]);
        _setFilteredHabits([]);
        _setLoading(false);
      }
    } catch (err) {
      console.error('Error loading local habits:', err);
      _setHabits([]);
      _setFilteredHabits([]);
      _setLoading(false);
    }
  };

  // Fetch habits from Supabase
  const fetchHabits = async () => {
    if (isOfflineMode) {
      loadLocalHabits();
      return;
    }
    
    _setLoading(true);
    
    // Check if we came from success page
    const fromSuccessPage = localStorage.getItem('fromSuccessPage') === 'true';
    if (fromSuccessPage) {
      logDebug(LogCategory.UI, 'Coming from success page, will attempt multiple fetches if needed');
      localStorage.removeItem('fromSuccessPage');
    }
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        _setHabits([]);
        _setFilteredHabits([]);
        _setLoading(false);
        return;
      }
      
      if (!user) {
        console.error('No user found when fetching habits');
        _setHabits([]);
        _setFilteredHabits([]);
        _setLoading(false);
        return;
      }
      
      console.log('Fetching habits for user:', user.id);
      
      // Try up to 3 times if coming from success page
      const maxAttempts = fromSuccessPage ? 3 : 1;
      let attempt = 0;
      let success = false;
      let habitsData = null;
      let fetchError = null;
      
      while (attempt < maxAttempts && !success) {
        attempt++;
        console.log(`Fetch attempt ${attempt}/${maxAttempts}`);
        
        try {
          const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id);
          
          if (error) {
            console.error(`Error fetching habits (attempt ${attempt}):`, error);
            fetchError = error;
            
            // Wait before retrying
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            console.log(`Fetched ${data?.length || 0} habits on attempt ${attempt}`);
            habitsData = data;
            success = true;
          }
        } catch (err) {
          console.error(`Exception fetching habits (attempt ${attempt}):`, err);
          fetchError = err;
          
          // Wait before retrying
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If we have data or all attempts are exhausted
      if (success && habitsData) {
        console.log('Successfully fetched habits:', habitsData);
        _setHabits(habitsData || []);
        _setFilteredHabits(habitsData || []);
      } else {
        console.error('All fetch attempts failed:', fetchError);
        _setHabits([]);
        _setFilteredHabits([]);
        
        // If we came from success page but failed to fetch habits after multiple attempts,
        // try one more approach - fetch goals and create placeholder habits
        if (fromSuccessPage) {
          console.log('Attempting to fetch goals and create placeholder habits');
          
          try {
            const { data: goals } = await supabase
              .from('user_goals')
              .select('*')
              .eq('user_id', user.id);
              
            if (goals && goals.length > 0) {
              console.log('Found goals, creating placeholder habits');
              
              // Create placeholder habits from goals
              const placeholderHabits = goals.map(goal => ({
                id: `placeholder-${goal.id}`,
                name: `Work on ${goal.goal}`,
                description: `Daily progress towards ${goal.goal}`,
                frequency: 'daily',
                user_id: user.id,
                goal_id: goal.id,
                created_at: new Date().toISOString()
              }));
              
              console.log('Created placeholder habits:', placeholderHabits);
              _setHabits(placeholderHabits);
              _setFilteredHabits(placeholderHabits);
            }
          } catch (err) {
            console.error('Error creating placeholder habits:', err);
          }
        }
      }
    } catch (err) {
      console.error('Exception in fetchHabits:', err);
      _setHabits([]);
      _setFilteredHabits([]);
    } finally {
      _setLoading(false);
    }
  };

  const handleTabChange = (tab: 'habits' | 'goals' | 'areas' | 'progress' | 'settings') => {
    setActiveTab(tab);
  };

  const handleAddHabit = () => {
    setShowAddHabitModal(true);
  };

  const handleGoalsUpdate = () => {
    setKey(prev => prev + 1);
    setActiveTab('habits');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'habits':
        switch (activeView) {
          case 'day':
            // Pass the viewMode prop correctly
            return <WeekView key={key} viewMode="day" />;
          case 'week':
            return <WeekView key={key} viewMode="week" />;
          case 'month':
            return <WeekView key={key} viewMode="month" />;
          case 'year':
            return <YearView key={key} />;
          default:
            return <WeekView key={key} viewMode="week" />;
        }
      case 'goals':
        return <GoalsView onGoalsUpdate={handleGoalsUpdate} />;
      case 'areas':
        return (
          <div className="text-center py-20 bg-gray-50 rounded-md">
            <h3 className="text-xl font-medium mb-2">Areas Coming Soon</h3>
            <p className="text-gray-600">Track and manage your life areas</p>
          </div>
        );
      case 'progress':
        return <ProgressView />;
      case 'settings':
        return (
          <div className="text-center py-20 bg-gray-50 rounded-md">
            <h3 className="text-xl font-medium mb-2">Settings Coming Soon</h3>
            <p className="text-gray-600">Customize your habits experience</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex">
      {/* Left side navigation panel - Sticky */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-center py-4 space-y-4 z-50">
        <div className="relative group">
          <button 
            onClick={() => setActiveView('day')}
            className={`w-14 h-14 flex items-center justify-center rounded-r-2xl transition-all duration-300 backdrop-blur-md
              ${activeView === 'day' 
                ? 'bg-red-500/90 text-white translate-x-2 shadow-lg' 
                : 'bg-white/80 text-gray-600 hover:bg-white/90 hover:translate-x-2'
              } shadow-sm hover:shadow-md`}
            aria-label="Day View"
          >
            <div className="font-bold text-lg group-hover:scale-110 transition-transform">D</div>
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Day View
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={() => setActiveView('week')}
            className={`w-14 h-14 flex items-center justify-center rounded-r-2xl transition-all duration-300 backdrop-blur-md
              ${activeView === 'week' 
                ? 'bg-red-500/90 text-white translate-x-2 shadow-lg' 
                : 'bg-white/80 text-gray-600 hover:bg-white/90 hover:translate-x-2'
              } shadow-sm hover:shadow-md`}
            aria-label="Week View"
          >
            <div className="font-bold text-lg group-hover:scale-110 transition-transform">W</div>
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Week View
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={() => setActiveView('month')}
            className={`w-14 h-14 flex items-center justify-center rounded-r-2xl transition-all duration-300 backdrop-blur-md
              ${activeView === 'month' 
                ? 'bg-red-500/90 text-white translate-x-2 shadow-lg' 
                : 'bg-white/80 text-gray-600 hover:bg-white/90 hover:translate-x-2'
              } shadow-sm hover:shadow-md`}
            aria-label="Month View"
          >
            <div className="font-bold text-lg group-hover:scale-110 transition-transform">M</div>
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Month View
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={() => setActiveView('year')}
            className={`w-14 h-14 flex items-center justify-center rounded-r-2xl transition-all duration-300 backdrop-blur-md
              ${activeView === 'year' 
                ? 'bg-red-500/90 text-white translate-x-2 shadow-lg' 
                : 'bg-white/80 text-gray-600 hover:bg-white/90 hover:translate-x-2'
              } shadow-sm hover:shadow-md`}
            aria-label="Year View"
          >
            <div className="font-bold text-lg group-hover:scale-110 transition-transform">Y</div>
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Year View
          </div>
        </div>
      </div>

      {/* Main content area - with padding for the fixed nav */}
      <div className="flex-1 pl-20 p-6">
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onAddHabit={handleAddHabit}
        />
        
        {renderActiveView()}
        
        {/* Add Habit Modal (placeholder) */}
        {showAddHabitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl w-96 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Add New Habit</h2>
              <p className="mb-4">This feature is coming soon.</p>
              <button 
                onClick={() => setShowAddHabitModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
