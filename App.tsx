import React, { useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div className="flex items-center justify-center h-screen bg-cyan-700 text-white font-semibold">Načítava sa kontext...</div>;
  }

  const { currentUser, isLoading } = context;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-cyan-700 text-white font-semibold">Načítava sa aplikácia...</div>;
  }

  return (
    <div className="min-h-screen font-sans text-slate-800">
      {currentUser ? <Dashboard /> : <LoginScreen />}
    </div>
  );
};

export default App;