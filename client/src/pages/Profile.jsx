import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock, UserCircle2, Wallet, BadgeCheck } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordInfo, setPasswordInfo] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const fetchBookings = async () => {
      try {
        const [bookingRes, notificationRes] = await Promise.all([
          api.get('/bookings/my'),
          api.get('/users/notifications')
        ]);

        setBookings(bookingRes.data);
        setNotifications(notificationRes.data.slice(0, 5));
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

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications((prev) => prev.map((item) => (
        item._id === id ? { ...item, isRead: true } : item
      )));
    } catch (err) {
      console.error(err);
    }
  };

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
    <div>
      <section className="glass" style={{ padding: '1.4rem', marginBottom: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Personal Dashboard</p>
            <h1 style={{ fontSize: '2.3rem', letterSpacing: '-0.03em' }}>Welcome back, {user?.name || 'Renter'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Track reservations, status updates, and spend in one place.</p>
          </div>
          <div style={{ minWidth: '240px' }} className="glass">
            <div style={{ padding: '0.9rem 1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}><UserCircle2 size={18} /> {user?.email}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', color: 'var(--accent-color)' }}><BadgeCheck size={18} /> Verified member</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1.4rem' }}>
        <article className="glass" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Active Rentals</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{activeBookings}</h3>
        </article>
        <article className="glass" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Completed</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{returnedBookings}</h3>
        </article>
        <article className="glass" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Spent</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Wallet size={18} /> {formatINR(totalSpent)}</h3>
        </article>
      </section>

      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.65rem' }}>Booking Timeline</h2>
        <p style={{ color: 'var(--text-muted)' }}>Every reservation and return status at a glance.</p>
      </div>

      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.4rem' }}>
        <h2 style={{ marginBottom: '0.8rem' }}>Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {notifications.map((item) => (
              <div key={item._id} style={{ border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '0.8rem', background: item.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(199, 160, 55, 0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{item.title}</strong>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.message}</p>
                  </div>
                  {!item.isRead && (
                    <button className="btn btn-outline" style={{ padding: '0.35rem 0.6rem' }} onClick={() => markNotificationRead(item._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass" style={{ padding: '1.35rem', marginBottom: '1.4rem' }}>
        <h2 style={{ marginBottom: '0.45rem' }}>Change Password</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.85rem' }}>Update your account password anytime.</p>

        {passwordError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.72rem 0.85rem', borderRadius: '10px', marginBottom: '0.8rem', color: '#ffd3d3' }}>
            {passwordError}
          </div>
        )}

        {passwordInfo && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.72rem 0.85rem', borderRadius: '10px', marginBottom: '0.8rem', color: '#c8ffe8' }}>
            {passwordInfo}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '0.8rem', maxWidth: '520px' }}>
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

      <div className="glass" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} color="var(--primary-color)" /> Booking History
        </h2>

        {bookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>You have no bookings yet. Go browse the catalog!</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {bookings.map(booking => (
              <div key={booking._id} style={{ border: '1px solid var(--glass-border)', padding: '1.1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                     {booking.clothId && booking.clothId.imageUrl && (
                      <img src={getClothImageSrc(booking.clothId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{booking.clothId?.title || 'Item Unavailable'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                      {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{formatINR(booking.totalPrice)}</p>
                  <span style={{ 
                    display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', marginTop: '0.5rem',
                    background: booking.status === 'returned' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(199, 160, 55, 0.2)',
                    color: booking.status === 'returned' ? 'var(--success)' : 'var(--primary-color)'
                  }}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
