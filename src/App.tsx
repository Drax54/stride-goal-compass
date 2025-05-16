import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { supabase } from './lib/supabase';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import HabitCreationSuccess from './components/HabitCreationSuccess';
import HabitTracker from './components/HabitTracker';
import Header from './components/Header';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auth listener setup
    const setupAuthListener = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(data.session);
        if (data.session?.user) {
          checkIfNewUser(data.session.user.id);
        }
        
        const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session?.user) {
            checkIfNewUser(session.user.id);
          }
        });

        setIsLoading(false);
        return authData.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setIsLoading(false);
        return null;
      }
    };
    
    // Setup auth listener and store subscription for cleanup
    let subscription: { unsubscribe: () => void } | null = null;
    setupAuthListener().then(sub => {
      subscription = sub;
    });

    // Cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkIfNewUser = async (userId: string | undefined) => {
    if (!userId) return;
    
    try {
      console.log(`Checking if user ${userId} is new...`);
      
      // Check if we're coming from the success page via localStorage flag
      const fromSuccessPage = localStorage.getItem('fromSuccessPage') === 'true';
      if (fromSuccessPage) {
        console.log('Coming from success page, forcing user to be treated as existing');
        localStorage.removeItem('fromSuccessPage');
        setIsNewUser(false);
        return;
      }
      
      // First check if we have any goals for this user
      console.log(`Querying user_goals table for user ${userId}...`);
      const { data: goalData, error: goalError } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
      if (goalError) {
        console.error('Error checking user goals:', goalError);
        // If there's an error (like table doesn't exist), assume new user
        setIsNewUser(true);
        return;
      }
      
      // Then check if we have any habits for this user
      console.log(`Querying habits table for user ${userId}...`);
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (habitError) {
        console.error('Error checking user habits:', habitError);
        // If there's an error (like table doesn't exist), assume new user
        setIsNewUser(true);
        return;
      }
      
      // User is new if they have no goals AND no habits
      const hasNoGoals = !goalData || goalData.length === 0;
      const hasNoHabits = !habitData || habitData.length === 0;
      
      setIsNewUser(hasNoGoals && hasNoHabits);
      console.log(`User ${userId} status: ${hasNoGoals ? 'No goals' : 'Has goals'}, ${hasNoHabits ? 'No habits' : 'Has habits'}`);
      console.log(`User is ${hasNoGoals && hasNoHabits ? 'new' : 'existing'}`);
    } catch (error) {
      console.error('Failed to check if user is new:', error);
      // If there's any unexpected error, assume new user to ensure onboarding
      setIsNewUser(true);
    }
  };

  // Show loading state when the app is still initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            !session ? (
              <SignIn />
            ) : isNewUser ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            !session ? (
              <SignUp />
            ) : isNewUser ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            session ? (
              isNewUser ? (
                <OnboardingFlow />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route
          path="/success"
          element={<HabitCreationSuccess />}
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              isNewUser ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <HabitTracker initialView="habits" />
                  </main>
                </div>
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;