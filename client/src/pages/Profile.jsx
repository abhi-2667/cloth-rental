import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock3, UserCircle2, Wallet, BadgeCheck, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordInfo, setPasswordInfo] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('all');

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const fetchBookings = async () => {
      try {
        const bookingRes = await api.get('/bookings/my');
        setBookings(bookingRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, navigate]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</div>;

  const activeBookings = bookings.filter((booking) => booking.status === 'booked').length;
  const returnedBookings = bookings.filter((booking) => booking.status === 'returned').length;
  const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'all') return true;
    return booking.status === bookingFilter;
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isUpdatingPassword) return;

    setPasswordError('');
    setPasswordInfo('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put('/users/profile', { password: newPassword });
      setPasswordInfo('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Unable to update password right now.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="glass profile-hero fade-up">
        <div className="profile-hero-main">
          <p className="profile-kicker">Personal Dashboard</p>
          <h1>Welcome back, {user?.name || 'Renter'}</h1>
          <p className="profile-subtitle">Track reservations, status updates, and spending in one place.</p>

          <div className="profile-hero-tags">
            <span><BadgeCheck size={14} /> Verified member</span>
            <span><Sparkles size={14} /> Premium closet access</span>
          </div>

          <div className="profile-quick-actions">
            <Link to="/notifications" className="btn btn-outline">Notifications</Link>
            <Link to="/browse" className="btn btn-primary">Browse Outfits</Link>
          </div>
        </div>

        <aside className="profile-account-card glass">
          <p className="profile-account-label">Account</p>
          <p className="profile-account-value"><UserCircle2 size={18} /> {user?.email}</p>
          <p className="profile-account-verified"><BadgeCheck size={18} /> Active & verified</p>
        </aside>
      </section>

      <section className="profile-stats-grid fade-up-delay">
        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--primary-color)', '--stat-bg': 'rgba(212, 175, 55, 0.15)' }}
        >
          <span className="profile-stat-icon"><Clock3 size={18} /></span>
          <p className="profile-stat-label">Active Rentals</p>
          <h3 className="profile-stat-value">{activeBookings}</h3>
        </article>

        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.15)' }}
        >
          <span className="profile-stat-icon"><CheckCircle2 size={18} /></span>
          <p className="profile-stat-label">Completed</p>
          <h3 className="profile-stat-value">{returnedBookings}</h3>
        </article>

        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--accent-color)', '--stat-bg': 'rgba(247, 225, 181, 0.15)' }}
        >
          <span className="profile-stat-icon"><Wallet size={18} /></span>
          <p className="profile-stat-label">Total Spent</p>
          <h3 className="profile-stat-value">{formatINR(totalSpent)}</h3>
        </article>
      </section>

      <section className="profile-main-grid">
        <div className="glass profile-password-card">
          <h2><ShieldCheck size={20} /> Security</h2>
          <p className="profile-card-subtitle">Keep your account protected by updating your password regularly.</p>

          {passwordError && (
            <div className="profile-msg profile-msg-error">
              {passwordError}
            </div>
          )}

          {passwordInfo && (
            <div className="profile-msg profile-msg-success">
              {passwordInfo}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="profile-password-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isUpdatingPassword} style={{ width: 'fit-content' }}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="glass profile-bookings-card">
          <div className="profile-section-heading-row profile-bookings-header">
            <div>
              <h2><Clock3 size={20} /> Booking History</h2>
              <p>Every reservation and return status at a glance.</p>
            </div>
            <span className="profile-pill">{bookings.length} total</span>
          </div>

          <div className="profile-booking-tabs">
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBookingFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'booked' ? 'active' : ''}`}
              onClick={() => setBookingFilter('booked')}
            >
              Active
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'returned' ? 'active' : ''}`}
              onClick={() => setBookingFilter('returned')}
            >
              Completed
            </button>
          </div>

          {filteredBookings.length === 0 ? (
            <p className="profile-empty-text">No bookings found for this filter.</p>
          ) : (
            <div className="profile-bookings-list">
              {filteredBookings.map((booking) => (
                <article key={booking._id} className="profile-booking-item">
                  <div className="profile-booking-main">
                    <div className="profile-booking-thumb">
                      {booking.clothId && booking.clothId.imageUrl && (
                        <img src={getClothImageSrc(booking.clothId)} alt="" />
                      )}
                    </div>

                    <div className="profile-booking-copy">
                      <h3>{booking.clothId?.title || 'Item Unavailable'}</h3>
                      <p>{formatDateRange(booking.startDate, booking.endDate)}</p>
                    </div>
                  </div>

                  <div className="profile-booking-meta">
                    <p>{formatINR(booking.totalPrice)}</p>
                    <span className={`profile-status-chip ${booking.status === 'returned' ? 'is-returned' : 'is-booked'}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
