import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const quotes = [
  "Small actions, repeated daily, create extraordinary results.",
  "Your habits shape your future.",
  "Progress is built one day at a time.",
  "Consistency over intensity.",
  "Every day is a new opportunity to build better habits."
];

const HabitCreationSuccess = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [goalsCount, setGoalsCount] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [error, setError] = useState('');

  // Check if habits were actually created
  const habitsCreated = location.state?.habitsCreated || localStorage.getItem('habitsCreated') === 'true';

  // Check authentication status and verify habits exist
  useEffect(() => {
    const checkHabitsAndAuth = async () => {
      try {
        console.log("Checking auth status and habit count...");
        
        // First check if we're in offline mode
        const isOfflineMode = location.state?.isOfflineMode || localStorage.getItem('isOfflineMode') === 'true';
        if (isOfflineMode) {
          console.log("User is in offline mode, skipping database checks");
          setUserAuthenticated(true);
          // Get counts from localStorage or location state
          const savedGoals = JSON.parse(localStorage.getItem('localGoals') || '[]');
          const savedHabits = JSON.parse(localStorage.getItem('localHabits') || '[]');
          
          setGoalsCount(savedGoals.length);
          let totalHabits = 0;
          if (Array.isArray(savedHabits)) {
            savedHabits.forEach(goal => {
              if (goal.habits && Array.isArray(goal.habits)) {
                totalHabits += goal.habits.length;
              }
            });
          }
          setHabitsCount(totalHabits);
          console.log(`Offline mode counts: ${savedGoals.length} goals, ${totalHabits} habits`);
          return;
        }
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Auth error in success page:", authError);
          setError('Authentication error. Please sign in again.');
          return;
        }
        
        if (!user) {
          console.error("No authenticated user found in success page");
          setError('No user found. Please sign in again.');
          return;
        }
        
        console.log("User authenticated in success page:", user.id);
        setUserAuthenticated(true);

        // Count goals
        console.log(`Querying goals for user ${user.id}...`);
        const { data: goals, error: goalsError } = await supabase
          .from('user_goals')
          .select('id')
          .eq('user_id', user.id);
        
        if (goalsError) {
          console.error("Error fetching goals:", goalsError);
          console.log("Error details:", JSON.stringify(goalsError));
        } else {
          console.log("Found goals:", goals?.length || 0);
          setGoalsCount(goals?.length || 0);
        }

        // Count habits
        console.log(`Querying habits for user ${user.id}...`);
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id);
        
        if (habitsError) {
          console.error("Error fetching habits:", habitsError);
          console.log("Error details:", JSON.stringify(habitsError));
        } else {
          console.log("Found habits:", habits?.length || 0);
          setHabitsCount(habits?.length || 0);
          
          // If no habits were found but we expected some, set an error
          if ((!habits || habits.length === 0) && habitsCreated) {
            console.warn("Expected habits but found none");
            setError('No habits were found. There may have been an issue creating them.');
          }
        }
        
        // Final sanity check - if we have goals but no habits, recreate habits
        if ((goals?.length || 0) > 0 && (habits?.length || 0) === 0) {
          console.log("Found goals but no habits - will direct to dashboard anyway");
          // Force dashboard navigation by setting authenticated
          setUserAuthenticated(true);
        }
      } catch (err) {
        console.error("Error in checkHabitsAndAuth:", err);
        console.error("Stack trace:", (err as Error).stack);
        setError('Error checking habits. Please try again.');
      }
    };
    
    checkHabitsAndAuth();
  }, [habitsCreated, location.state?.isOfflineMode]);

  // Manual navigation if user clicks
  const handleManualContinue = () => {
    console.log("User clicked continue manually");
    // Set flag to bypass new user check
    localStorage.setItem('fromSuccessPage', 'true');
    // Clear habit creation flags
    localStorage.removeItem('habitsCreated');
    localStorage.removeItem('habitCreationTime');
    
    navigate('/dashboard', { replace: true });
  };

  // Navigate to dashboard after 8 seconds
  useEffect(() => {
    console.log("Success screen loaded, will navigate in 8 seconds");
    console.log("Habits created flag:", habitsCreated);
    console.log("Auth status:", userAuthenticated);
    
    const timer = setTimeout(() => {
      console.log("Auto-navigating to dashboard");
      console.log("Final status - Auth:", userAuthenticated, "Goals:", goalsCount, "Habits:", habitsCount);
      
      // Only navigate if authenticated
      if (userAuthenticated) {
        // Set flag to bypass new user check
        localStorage.setItem('fromSuccessPage', 'true');
        // Clear localStorage flags after successful navigation
        localStorage.removeItem('habitsCreated');
        localStorage.removeItem('habitCreationTime');
        
        navigate('/dashboard', { 
          replace: true,
          state: { 
            fromSuccess: true,
            goalsCount,
            habitsCount
          }
        });
      } else {
        console.error("Not navigating: User not authenticated");
        // If not authenticated after timer expires, give option to navigate anyway
        setError('Not authenticated. Click to continue anyway.');
      }
    }, 8000); // Increased from 6000 to 8000ms for more debug time

    return () => clearTimeout(timer);
  }, [navigate, userAuthenticated, goalsCount, habitsCount, habitsCreated]);

  // Rotate quotes every second
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 1500); // Slowed down to 1.5s for better readability

    return () => clearInterval(quoteTimer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900">
      <div className="text-center text-white p-8 max-w-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {error ? (
            <AlertCircle size={80} className="mx-auto mb-6 text-yellow-400" />
          ) : (
            <CheckCircle size={80} className="mx-auto mb-6 text-green-400" />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-6"
        >
          {error ? "Hmmm, something's not right" : "All set! Your habits are ready"}
        </motion.h1>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-200 mb-6"
          >
            {error}
          </motion.p>
        )}

        {!error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-200 mb-6"
          >
            <p>Found {goalsCount} goals and {habitsCount} habits</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-xl text-blue-100 italic mb-8"
          >
            "{quotes[currentQuote]}"
          </motion.p>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-2 text-blue-200">
            <span>Redirecting to your dashboard</span>
            <ArrowRight size={20} className="animate-pulse" />
          </div>

          <button
            onClick={handleManualContinue}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Continue Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HabitCreationSuccess;