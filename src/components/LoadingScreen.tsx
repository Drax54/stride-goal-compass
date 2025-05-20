
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-16 h-16 border-4 border-t-red-500 border-b-red-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      <h2 className="mt-6 text-xl font-semibold text-gray-700">Loading...</h2>
      <p className="mt-2 text-gray-500">Setting up your habits</p>
    </div>
  );
};

export default LoadingScreen;
