import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DayView = () => {
  const habits = [
    { id: 1, name: 'Practice One BJJ Technique', completed: true },
    { id: 2, name: 'Slept 7 Hours Last Night', completed: false },
    { id: 3, name: 'Daily Meditation', completed: true },
    { id: 4, name: 'Strength Training', completed: true },
    { id: 5, name: 'Plan Daily Priorities', completed: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-gray-500">Monday</div>
          <div className="text-3xl font-bold text-gray-900">10th February</div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <span className="text-gray-900">{habit.name}</span>
            <button
              className={`w-24 py-2 px-4 rounded-lg text-center ${
                habit.completed
                  ? 'bg-green-600 text-white'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {habit.completed ? '✓' : '×'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayView;