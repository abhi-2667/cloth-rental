import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Tag, ShieldCheck } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (value) => {
  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cloth, setCloth] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchBookingContext = async () => {
      try {
        const [clothRes, blockedRes] = await Promise.all([
          api.get(`/clothes/${id}`),
          api.get(`/bookings/cloth/${id}/blocked`)
        ]);

        setCloth(clothRes.data);
        setBlockedRanges(blockedRes.data || []);
      } catch (err) {
        setError('Failed to load item.');
      } finally {
        setIsLoadingBlockedDates(false);
      }
    };

    fetchBookingContext();
  }, [id]);

  const selectedRangeOverlaps = startDate && endDate && blockedRanges.some((range) => {
    const selectedStart = toDateOnly(startDate);
    const selectedEnd = toDateOnly(endDate);
    const blockedStart = toDateOnly(range.startDate);
    const blockedEnd = toDateOnly(range.endDate);

    return blockedStart <= selectedEnd && blockedEnd >= selectedStart;
  });

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to book an item"); return;
    }
    setError(''); setSuccess('');

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    if (selectedRangeOverlaps) {
      setError('Selected dates overlap with an existing booking. Choose another range.');
      return;
    }

    try {
      await api.post('/bookings', {
        clothId: id,
        startDate,
        endDate
      });
      setSuccess('Booking successful! Redirecting to profile...');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  if (!cloth) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

  const imageUrl = getClothImageSrc(cloth);
  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))) : 0;
  const total = days * cloth.pricePerDay;

  return (
    <div className="flex" style={{ gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div className="glass" style={{ flex: '1 1 400px', height: '500px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        <img src={imageUrl} alt={cloth.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = getClothImageSrc({ title: cloth.title, category: cloth.category }); }} />
      </div>
      
      <div style={{ flex: '1 1 400px' }}>
        <span style={{ color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{cloth.category}</span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>{cloth.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{cloth.description}</p>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Price (INR)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatINR(cloth.pricePerDay)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/day</span></p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Size</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600 }}><Tag size={20} style={{ display: 'inline', marginRight: '0.5rem' }}/>{cloth.size}</p>
          </div>
        </div>

        <form className="glass" style={{ padding: '2rem' }} onSubmit={handleBooking}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} /> Select Rental Dates
          </h3>
          
          {error && <div style={{ background: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ background: 'var(--success)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate || new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Availability Calendar (Booked Ranges)</p>
            {isLoadingBlockedDates ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading unavailable dates...</p>
            ) : blockedRanges.length === 0 ? (
              <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>No blocked dates. Fully available.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {blockedRanges.map((range, index) => (
                  <span key={`${range.startDate}-${range.endDate}-${index}`} style={{ fontSize: '0.8rem', background: 'rgba(255, 59, 48, 0.15)', color: '#ffd5d0', padding: '0.35rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(255, 59, 48, 0.4)' }}>
                    {formatDate(range.startDate)} - {formatDate(range.endDate)}
                  </span>
                ))}
              </div>
            )}

            {selectedRangeOverlaps && (
              <p style={{ color: '#ffb4ab', marginTop: '0.6rem', fontSize: '0.85rem' }}>
                The selected date range is unavailable.
              </p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Total for {days} day(s)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatINR(total || 0)}</span>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={!cloth.availability || selectedRangeOverlaps}>
            {cloth.availability ? 'Confirm Booking' : 'Currently Unavailable'}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} /> Secure reservation & payment
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
