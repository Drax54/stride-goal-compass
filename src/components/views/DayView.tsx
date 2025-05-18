import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DayView = () => {
  const habits = [
    { id: 1, name: 'Set daily priorities', completed: true },
    { id: 2, name: 'Time block tasks', completed: false },
    { id: 3, name: 'Exercise 30 mins', completed: true },
    { id: 4, name: 'Quality time with family', completed: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-3xl font-bold text-gray-900">Dec 15, 2024</div>
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
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={habit.completed}
                className="w-5 h-5 mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className={habit.completed ? 'line-through text-gray-500' : ''}>
                {habit.name}
              </span>
            </div>
            <div className="text-sm text-gray-500">Daily</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayView;
