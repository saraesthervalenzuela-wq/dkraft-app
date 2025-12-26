import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = ({ onSwitchToRegister, onForgotPassword }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = () => {
    if (error) clearError();
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="logo-icon">D</span>
          <span className="logo-text">D-KRAFT</span>
        </div>
        <h1>Bienvenido</h1>
        <p>Inicia sesión para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error">
            <span className="material-symbols-rounded">error</span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="material-symbols-rounded input-icon">mail</span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); handleInputChange(); }}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <div className="input-wrapper">
            <span className="material-symbols-rounded input-icon">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); handleInputChange(); }}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-rounded">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div className="form-options">
          <button
            type="button"
            className="forgot-password"
            onClick={onForgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToRegister}>
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
