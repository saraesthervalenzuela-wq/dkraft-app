import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

const ResetPassword = () => {
  const { updatePassword, exitPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Tras el éxito, muestra el mensaje un instante y abre el dashboard.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => exitPasswordRecovery(), 1800);
    return () => clearTimeout(timer);
  }, [success, exitPasswordRecovery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-background">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
      <div className="auth-container">
        {success ? (
          <div className="auth-card">
            <div className="auth-header">
              <div className="success-icon">
                <span className="material-symbols-rounded">check_circle</span>
              </div>
              <h1>Contraseña actualizada</h1>
              <p>Tu contraseña se cambió exitosamente. Abriendo el dashboard…</p>
            </div>

            <button
              type="button"
              className="auth-button primary"
              onClick={exitPasswordRecovery}
            >
              Ir al dashboard
            </button>
          </div>
        ) : (
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <span className="logo-icon">D</span>
                <span className="logo-text">D-KRAFT</span>
              </div>
              <h1>Nueva contraseña</h1>
              <p>Ingresa y confirma tu nueva contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error">
                  <span className="material-symbols-rounded">error</span>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="new-password">Nueva contraseña</label>
                <div className="input-wrapper">
                  <span className="material-symbols-rounded input-icon">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
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
                <label htmlFor="confirm-password">Confirmar contraseña</label>
                <div className="input-wrapper">
                  <span className="material-symbols-rounded input-icon">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                    placeholder="••••••••"
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
                    Guardando...
                  </>
                ) : (
                  'Siguiente'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
