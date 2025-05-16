import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthView = () => {
  const habits = [
    { id: 1, name: 'Set daily priorities', days: Array(31).fill(true) },
    { id: 2, name: 'Time block tasks', days: Array(31).fill(true) },
    { id: 3, name: 'Exercise 30 mins', days: Array(31).fill(true) },
    { id: 4, name: 'Quality time with family', days: Array(31).fill(true) },
  ];

  // Generate dates for the month
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-gray-500">Month</div>
          <div className="text-3xl font-bold text-gray-900">Dec 2024</div>
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

      <div className="space-y-6">
        {/* Dates header */}
        <div className="grid grid-cols-[200px_repeat(31,minmax(25px,1fr))] gap-1">
          <div></div>
          {dates.map((date) => (
            <div key={date} className="text-center text-xs font-medium text-gray-500">
              {date}
            </div>
          ))}
        </div>

        {/* Habits grid */}
        {habits.map((habit) => (
          <div key={habit.id} className="grid grid-cols-[200px_repeat(31,minmax(25px,1fr))] gap-1">
            <div className="text-sm text-gray-900">{habit.name}</div>
            {habit.days.map((completed, index) => (
              <button
                key={index}
                className={`h-6 rounded ${
                  completed ? 'bg-green-600' : 'bg-red-100'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;