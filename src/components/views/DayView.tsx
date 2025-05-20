
import { format } from 'date-fns';

const DayView = () => {
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{formattedDate}</h2>
      <p className="text-gray-600">Day view implementation coming soon.</p>
    </div>
  );
};

export default DayView;
