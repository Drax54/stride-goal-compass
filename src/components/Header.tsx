
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">Habitify</span>
          <span className="bg-white text-red-500 text-xs px-2 py-0.5 rounded-md">Alpha</span>
        </div>
        
        {user && (
          <div className="flex items-center">
            <span className="mr-4 text-sm hidden md:block">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="p-2 hover:bg-red-700 rounded-full"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
