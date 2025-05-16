import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AnalyticsView = () => {
  const areas = [
    { name: 'Health', completed: 4, failed: 0, successRate: 100 },
    { name: 'Work & Career', completed: 20, failed: 0, successRate: 100 },
    { name: 'Relationships', completed: 15, failed: 2, successRate: 88 },
    { name: 'Lifestyle', completed: 3, failed: 1, successRate: 75 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <h2 className="text-4xl font-bold text-red-500 mt-2">Analytics</h2>
      </div>

      <div className="space-y-6">
        <div className="flex space-x-4">
          {['Habits', 'Goals', 'Areas'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-2 text-gray-600 ${
                tab === 'Habits' ? 'bg-gray-100 rounded-lg' : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex space-x-4">
          {['Week', 'Month', 'Quarter', 'Year'].map((period) => (
            <button
              key={period}
              className={`px-6 py-2 text-gray-600 ${
                period === 'Week' ? 'bg-gray-100 rounded-lg' : ''
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-2 text-gray-600">
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>
          <div className="text-gray-900 font-medium">Week of Feb 3</div>
          <button className="flex items-center space-x-2 text-gray-600">
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Area Progress Tracker</h3>
          {areas.map((area) => (
            <div key={area.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-900">{area.name}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">↗ {area.completed}</span>
                  <span className="text-red-600">↘ {area.failed}</span>
                  <span className="text-gray-900">{area.successRate}% success rate</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${area.successRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;