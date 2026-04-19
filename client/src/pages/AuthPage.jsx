import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getEditorialPanelSrc } from '../utils/visuals';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/signin';
  const { login, register, requestLoginLink } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('');
  const [useMagicLinkLogin, setUseMagicLinkLogin] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      return;
    }

    const mode = isLogin ? 'login' : 'signup';
    navigate(`/verify-link?token=${encodeURIComponent(token)}&mode=${mode}`, { replace: true });
  }, [location.search, isLogin, navigate]);

  useEffect(() => {
    if (isLogin) {
      setLoginMode('');
      setUseMagicLinkLogin(false);
    }
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        if (!loginMode) {
          setError('Please choose login type: user or admin.');
          return;
        }

        if (!useMagicLinkLogin) {
          await login(email, password, loginMode);
          navigate('/');
          return;
        }

        const result = await requestLoginLink(email, loginMode);
        if (result?.deliveryMode === 'smtp') {
          setInfo(`Sign-in link sent to ${result?.sentTo || email}. Please check your email.`);
        } else {
          setInfo(`Sign-in request submitted for ${result?.sentTo || email}. Please check your email inbox.`);
        }
        return;
      }

      const result = await register(name, email, password);
      setInfo(result?.message || 'Account created. Waiting for admin approval.');
      setName('');
      setEmail('');
      setPassword('');
      return;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-clean-wrap auth-studio-wrap auth-page">
      <div className="auth-studio-glow" aria-hidden="true" />
      <div className="auth-page-shell glass">
        <aside className="auth-editorial" aria-hidden="true">
          <img
            src={getEditorialPanelSrc(isLogin ? 'Sign In' : 'Sign Up', isLogin ? 'party' : 'wedding')}
            alt=""
            className="auth-editorial-image"
          />
          <div className="auth-editorial-overlay" />
          <div className="auth-editorial-content">
            <span className="auth-editorial-kicker">LuxeRentals Studio</span>
            <h2>{isLogin ? 'Your next look is one step away.' : 'Create your style command center.'}</h2>
            <p>
              {isLogin
                ? 'Track bookings, handle returns, and secure premium pieces with fast checkouts.'
                : 'Open your account to reserve curated outfits and manage approvals without friction.'}
            </p>
            <div className="auth-editorial-pills">
              <span><ShieldCheck size={14} /> Secure</span>
              <span><Star size={14} /> Curated</span>
              <span><Sparkles size={14} /> Premium</span>
            </div>
          </div>
        </aside>

        <div className="auth-clean-card auth-studio-card">
          <div className="auth-studio-header">
            <p className="auth-clean-kicker">LuxeRentals</p>
            <h1 className="auth-clean-title">{isLogin ? 'Sign in to continue' : 'Create your account'}</h1>
            <p className="auth-clean-subtitle">
              {isLogin
                ? 'Use your account to manage bookings, returns, and profile in one place.'
                : 'Sign up to request bookings. Your account will be enabled after admin approval.'}
            </p>
          </div>

          {error && <div className="auth-message auth-message-error">{error}</div>}
          {info && <div className="auth-message auth-message-success">{info}</div>}

          {isLogin && !loginMode ? (
            <div className="auth-role-gate">
              <p className="auth-choice-label">Choose Login Type</p>
              <h2 className="auth-role-title">Continue as Admin or User</h2>
              <div className="auth-role-grid">
                <button
                  type="button"
                  className="auth-role-card"
                  onClick={() => {
                    setLoginMode('user');
                    setInfo('');
                    setError('');
                  }}
                >
                  <span className="auth-role-card-title">User Login</span>
                  <span className="auth-role-card-subtitle">Book and manage rentals</span>
                </button>
                <button
                  type="button"
                  className="auth-role-card"
                  onClick={() => {
                    setLoginMode('admin');
                    setInfo('');
                    setError('');
                  }}
                >
                  <span className="auth-role-card-title">Admin Login</span>
                  <span className="auth-role-card-subtitle">Manage approvals and inventory</span>
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="auth-clean-form">
            {isLogin && (
              <div className="auth-choice-grid">
                <div className="auth-choice-block">
                  <p className="auth-choice-label">Login Type</p>
                  <div className="auth-login-type-row">
                    <span className="auth-login-type-badge">{loginMode === 'admin' ? 'Admin Login' : 'User Login'}</span>
                    <button
                      type="button"
                      className="btn btn-outline auth-change-role-btn"
                      onClick={() => {
                        setLoginMode('');
                        setUseMagicLinkLogin(false);
                        setInfo('');
                        setError('');
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="auth-choice-block">
                  <p className="auth-choice-label">Method</p>
                  <div className="auth-segment">
                    <button
                      type="button"
                      className={`auth-segment-btn ${!useMagicLinkLogin ? 'active' : ''}`}
                      onClick={() => {
                        setUseMagicLinkLogin(false);
                        setInfo('');
                        setError('');
                      }}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      className={`auth-segment-btn ${useMagicLinkLogin ? 'active' : ''}`}
                      onClick={() => {
                        setUseMagicLinkLogin(true);
                        setInfo('');
                        setError('');
                      }}
                    >
                      Magic Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            {(!isLogin || !useMagicLinkLogin) && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
              </div>
            )}

            {isLogin && useMagicLinkLogin && (
              <p className="auth-clean-note auth-inline-note">A secure sign-in link will be sent to your email.</p>
            )}

            <button type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={isSubmitting}>
              {isLogin
                ? useMagicLinkLogin
                  ? (isSubmitting ? 'Sending link...' : 'Send Sign-in Link')
                  : (isSubmitting ? 'Signing in...' : 'Sign In')
                : (isSubmitting ? 'Creating account...' : 'Create Account')}
              <ArrowRight size={16} />
            </button>
          </form>
          )}

          <div className="auth-switch-text">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/signup' : '/signin'} className="auth-switch-link">
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </div>

          {!isLogin && (
            <p className="auth-clean-note">
              Note: New accounts are created in pending state until approved by admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
