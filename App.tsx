
import React, { useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div>Načítava sa...</div>;
  }

  const { currentUser } = context;

  return (
    <div className="min-h-screen font-sans text-slate-800">
      {currentUser ? <Dashboard /> : <LoginScreen />}
    </div>
  );
};

export default App;
