import React from 'react';

interface TabNavigationProps {
  activeTab: 'habits' | 'goals' | 'areas' | 'progress' | 'settings';
  onTabChange: (tab: 'habits' | 'goals' | 'areas' | 'progress' | 'settings') => void;
  onAddHabit?: () => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  onAddHabit
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <nav className="flex space-x-1">
        <button
          onClick={() => onTabChange('habits')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'habits'
              ? 'bg-red-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Habits
        </button>
        <button
          onClick={() => onTabChange('goals')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'goals'
              ? 'bg-red-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Goals
        </button>
        <button
          onClick={() => onTabChange('areas')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'areas'
              ? 'bg-red-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Areas
        </button>
        <button
          onClick={() => onTabChange('progress')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'progress'
              ? 'bg-red-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Progress
        </button>
      </nav>

      <div className="flex items-center space-x-2">
        <button
          onClick={onAddHabit}
          className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Habit
        </button>
      </div>
    </div>
  );
};

export default TabNavigation; 