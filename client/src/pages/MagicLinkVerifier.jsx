import { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MagicLinkVerifier = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyLoginLink, verifySignupLink } = useContext(AuthContext);

  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [mode, setMode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    const modeParam = params.get('mode');

    if (!tokenParam || (modeParam !== 'login' && modeParam !== 'signup')) {
      setStatus('error');
      setError('Invalid verification link. Please request a new link.');
      return;
    }

    setToken(tokenParam);
    setMode(modeParam);
    setStatus('ready');
  }, [location.search]);

  const handleContinue = async () => {
    if (!token || (mode !== 'login' && mode !== 'signup') || status === 'verifying') {
      return;
    }

    setStatus('verifying');
    setError('');

    try {
      if (mode === 'login') {
        await verifyLoginLink(token);
      } else {
        await verifySignupLink(token);
      }

      navigate('/profile', { replace: true });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'Verification failed');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="glass" style={{ padding: '2rem', maxWidth: '720px', margin: '2rem auto' }}>
        <h2 style={{ marginBottom: '0.6rem' }}>Verifying your link...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please wait while we securely sign you in.</p>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="glass" style={{ padding: '2rem', maxWidth: '760px', margin: '2rem auto' }}>
        <p style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Secure Link</p>
        <h2 style={{ marginBottom: '0.5rem' }}>{mode === 'login' ? 'Complete Sign In' : 'Complete Account Verification'}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Press continue to use this one-time link.
        </p>
        <button className="btn btn-primary" onClick={handleContinue}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: '2rem', maxWidth: '760px', margin: '2rem auto' }}>
      <p style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Verification Failed</p>
      <h2 style={{ marginBottom: '0.5rem' }}>This link is not valid anymore</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <Link to="/signin" className="btn btn-primary">Request Sign-In Link</Link>
        <Link to="/signup" className="btn btn-outline">Create Account</Link>
      </div>
    </div>
  );
};

export default MagicLinkVerifier;
