import { useState } from 'react';
import Login from './Login';
import Register from './Register';
// ForgotPassword removed - backend endpoint not implemented yet
// import ForgotPassword from './ForgotPassword';
import './auth.css';

const AuthLayout = () => {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

  const renderView = () => {
    switch (view) {
      case 'register':
        return <Register onSwitchToLogin={() => setView('login')} />;
      // ForgotPassword view removed - backend endpoint not implemented yet
      // case 'forgot':
      //   return <ForgotPassword onBack={() => setView('login')} />;
      case 'login':
      default:
        return (
          <Login
            onSwitchToRegister={() => setView('register')}
            // onForgotPassword disabled until backend implements endpoint
            onForgotPassword={() => {}}
          />
        );
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-background">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
      <div className="auth-container">
        {renderView()}
      </div>
    </div>
  );
};

export default AuthLayout;
