
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { logEvent, LogCategory } from '../lib/logger';

interface NavigationProps {
  currentView: 'day' | 'week' | 'month' | 'year' | 'analytics';
  onViewChange: (view: 'day' | 'week' | 'month' | 'year' | 'analytics') => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const handleViewChange = (view: 'day' | 'week' | 'month' | 'year' | 'analytics') => {
    logEvent(LogCategory.NAVIGATION, 'View change', { from: currentView, to: view });
    onViewChange(view);
  };
  
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex space-x-4">
        {['day', 'week', 'month', 'year', 'analytics'].map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === view
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Navigation;
