
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HabitsProvider } from './contexts/HabitsContext';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import HabitCreationSuccess from './components/HabitCreationSuccess';
import HabitTracker from './components/HabitTracker';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';

// Route guard component with proper typing
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireNewUser = false 
}: { 
  children: React.ReactNode; 
  requireAuth?: boolean; 
  requireNewUser?: boolean;
}) => {
  const { user, isLoading, isNewUser } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (requireAuth && !user) {
    return <Navigate to="/" replace />;
  }
  
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (requireNewUser && !isNewUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!requireNewUser && user && isNewUser) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute requireAuth={false}>
            <SignIn />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <ProtectedRoute requireAuth={false}>
            <SignUp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute requireAuth={true} requireNewUser={true}>
            <OnboardingFlow />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/success"
        element={
          <ProtectedRoute requireAuth={true}>
            <HabitCreationSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireAuth={true}>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <HabitTracker initialView="habits" />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <HabitsProvider>
        <Router>
          <AppRoutes />
        </Router>
      </HabitsProvider>
    </AuthProvider>
  );
}

export default App;
