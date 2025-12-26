import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const { register, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
    if (validationError) setValidationError('');
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.displayName);
    } catch (err) {
      // Error is handled by context
    } finally {
      setLoading(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="logo-icon">D</span>
          <span className="logo-text">D-KRAFT</span>
        </div>
        <h1>Crear cuenta</h1>
        <p>Regístrate para comenzar</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {displayError && (
          <div className="auth-error">
            <span className="material-symbols-rounded">error</span>
            {displayError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="displayName">Nombre completo</label>
          <div className="input-wrapper">
            <span className="material-symbols-rounded input-icon">person</span>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-wrapper">
            <span className="material-symbols-rounded input-icon">mail</span>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <div className="input-wrapper">
            <span className="material-symbols-rounded input-icon">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Creando cuenta...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToLogin}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
