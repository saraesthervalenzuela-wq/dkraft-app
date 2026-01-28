import { useState } from 'react';
import { resetPassword } from '../../firebase';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card">
        <div className="auth-header">
          <div className="success-icon">
            <span className="material-symbols-rounded">mark_email_read</span>
          </div>
          <h1>Correo enviado</h1>
          <p>
            Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
          </p>
        </div>

        <button
          type="button"
          className="auth-button primary"
          onClick={onBack}
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="logo-icon">D</span>
          <span className="logo-text">D-KRAFT</span>
        </div>
        <h1>Recuperar contraseña</h1>
        <p>Ingresa tu correo y te enviaremos instrucciones</p>
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
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@email.com"
              required
              autoComplete="email"
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
              Enviando...
            </>
          ) : (
            'Enviar instrucciones'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          <button type="button" onClick={onBack}>
            ← Volver al inicio de sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
