import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { InputEmail } from '../component/InputEmail';
import { InputPassword } from '../component/InputPassword';
import { ActionButton } from '../component/ActionButton';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = (user.role || '').toUpperCase();
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/attendance', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const role = (loggedUser.role || '').toUpperCase();
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/attendance', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-badge">HRIS ONE</div>
          <h2>Sign In</h2>
          <p className="subtitle">Enter your employee or administrator credentials</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <InputEmail
              value={email}
              onChange={(val: string) => setEmail(val)}
              placeholder="name@company.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <InputPassword
              value={password}
              onChange={(val: string) => setPassword(val)}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          <ActionButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            variant="primary"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </ActionButton>
        </form>
      </div>
    </div>
  );
};