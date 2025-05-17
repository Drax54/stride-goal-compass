
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logEvent, logError, LogCategory } from '../lib/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isNewUser: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isNewUser: false,
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const setupAuthListener = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(data.session);
        if (data.session?.user) {
          setUser(data.session.user);
          checkIfNewUser(data.session.user.id);
        }
        
        const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user || null);
          if (session?.user) {
            checkIfNewUser(session.user.id);
          }
        });

        setIsLoading(false);
        return authData.subscription;
      } catch (error) {
        logError(LogCategory.AUTH, 'Error setting up auth listener', { error });
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

  const checkIfNewUser = async (userId: string) => {
    if (!userId) return;
    
    try {
      logEvent(LogCategory.AUTH, 'Checking if user is new', { userId });
      
      // Check if we're coming from the success page via localStorage flag
      const fromSuccessPage = localStorage.getItem('fromSuccessPage') === 'true';
      if (fromSuccessPage) {
        localStorage.removeItem('fromSuccessPage');
        setIsNewUser(false);
        return;
      }
      
      // First check if we have any goals for this user
      const { data: goalData, error: goalError } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
    
      if (goalError) {
        throw goalError;
      }
      
      // Then check if we have any habits for this user
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (habitError) {
        throw habitError;
      }
      
      // User is new if they have no goals AND no habits
      const hasNoGoals = !goalData || goalData.length === 0;
      const hasNoHabits = !habitData || habitData.length === 0;
      
      setIsNewUser(hasNoGoals && hasNoHabits);
      logEvent(LogCategory.AUTH, 'User status determined', { 
        userId, 
        isNew: hasNoGoals && hasNoHabits,
        hasGoals: !hasNoGoals, 
        hasHabits: !hasNoHabits 
      });
    } catch (error) {
      logError(LogCategory.AUTH, 'Failed to check if user is new', { error });
      // If there's any unexpected error, assume new user to ensure onboarding
      setIsNewUser(true);
    }
  };

  const signOut = async () => {
    try {
      logEvent(LogCategory.AUTH, 'User signing out');
      await supabase.auth.signOut();
      logEvent(LogCategory.AUTH, 'User signed out successfully');
    } catch (error) {
      logError(LogCategory.AUTH, 'Error signing out', { error });
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isNewUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
