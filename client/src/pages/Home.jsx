import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, CalendarDays, IndianRupee, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { getEditorialPanelSrc } from '../utils/visuals';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <section className="glass hero-shell fade-up" style={{ marginTop: '1rem' }}>
        <div className="hero-grid">
          <div>
            <p style={{ color: 'var(--accent-color)', marginBottom: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>
              India-first Occasion Rental Platform
            </p>
            <h1 className="hero-title">
              From weddings to festive nights, <span className="accent">rent your perfect look.</span>
            </h1>
            <p style={{ fontSize: '1.08rem', color: 'var(--text-muted)', maxWidth: '620px' }}>
              From lehenga and sherwani edits to cocktail gowns and festive kurtas, discover curated outfits for Indian events without the full purchase cost.
            </p>
            <div className="home-insight-strip">
              <span className="insight-chip"><ShieldCheck size={12} /> Quality-checked pieces</span>
              <span className="insight-chip"><CalendarDays size={12} /> Date-safe availability</span>
              <span className="insight-chip"><IndianRupee size={12} /> Transparent pricing</span>
            </div>
            <div className="flex items-center gap-4" style={{ marginTop: '1.4rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/browse')} className="btn btn-primary">
                Explore Outfits <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/browse?category=wedding')} className="btn btn-outline">
                Wedding Edit
              </button>
              <button onClick={() => navigate('/signin')} className="btn btn-outline">
                Sign In / Register
              </button>
            </div>

            <div className="hero-kpis fade-up-delay">
              <div className="kpi-card">
                <div className="kpi-value">INR 1,499+</div>
                <div className="kpi-label">Looks for every budget</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">500+</div>
                <div className="kpi-label">Event-ready pieces</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">48h</div>
                <div className="kpi-label">Quick prep and dispatch</div>
              </div>
            </div>
          </div>

          <div className="showcase-stack fade-up-delay">
            <div className="showcase-tile" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
              <img src={getEditorialPanelSrc('Bridal Edit', 'wedding')} alt="Bridal edit lookbook" style={{ width: '100%', height: '100%', minHeight: '230px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '0.9rem', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
                <strong>Bridal and Wedding Edit</strong>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Bridal gowns, formal suits, and reception-ready pieces curated for multi-day celebrations.</p>
              </div>
            </div>
            <div className="showcase-tile" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
              <img src={getEditorialPanelSrc('Festive Drop', 'party')} alt="Festive party lookbook" style={{ width: '100%', height: '100%', minHeight: '230px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '0.9rem', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
                <strong>Festive and Cocktail Drop</strong>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Cocktail glamour, evening sparkle, and statement contemporary event looks.</p>
              </div>
            </div>
            <div className="showcase-tile" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
              <img src={getEditorialPanelSrc('Ethnic Essentials', 'casual')} alt="Ethnic essentials lookbook" style={{ width: '100%', height: '100%', minHeight: '230px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '0.9rem', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
                <strong>Ethnic Essentials</strong>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Classic festive styles for family gatherings, ceremonies, and celebrations.</p>
              </div>
            </div>
            <div className="showcase-tile">
              <Truck size={20} style={{ color: 'var(--accent-color)', marginBottom: '0.45rem' }} />
              <strong>Pickup and Return Simplicity</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Wear it, return it. Track booking and return status from your profile.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '3rem' }}>
        <h2 className="section-heading" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>Occasions We Designed For</h2>
        <p className="occasion-subtitle">Choose your event and jump directly to the most relevant styles.</p>
        <div className="occasion-grid">
          {[
            { name: 'Wedding Functions', desc: 'Engagement, pre-wedding, ceremony, and reception wardrobes.', tag: 'Most booked' },
            { name: 'Cocktail and Party', desc: 'Bold fits for nightlife, clubs, and celebratory dinners.', tag: 'Evening edit' },
            { name: 'Festive and Family', desc: 'Diwali, Eid, Navratri, engagement, and puja picks.', tag: 'Seasonal picks' },
            { name: 'College Farewell', desc: 'Standout graduation and farewell outfits at student-friendly prices.', tag: 'Budget smart' }
          ].map((item, index) => (
            <button
              key={item.name}
              className="glass occasion-card"
              onClick={() => navigate(index === 0 ? '/browse?category=wedding' : index === 1 ? '/browse?category=party' : '/browse?category=casual')}
            >
              <div className="occasion-card-head">
                <span className="occasion-tag">{item.tag}</span>
                <ArrowUpRight size={16} />
              </div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
              <span className="occasion-link">Explore now</span>
            </button>
          ))}
        </div>
      </div>

      <section className="container" style={{ marginTop: '3rem' }}>
        <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: '1.2rem' }}>How Renting Works</h2>
        <div className="journey-grid">
          <article className="glass value-card">
            <CalendarDays size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.45rem' }} />
            <h3 style={{ marginBottom: '0.35rem' }}>1. Select event date</h3>
            <p style={{ color: 'var(--text-muted)' }}>Pick your outfit and rental period. Date overlap checks protect availability.</p>
          </article>
          <article className="glass value-card">
            <IndianRupee size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.45rem' }} />
            <h3 style={{ marginBottom: '0.35rem' }}>2. Pay less, wear premium</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get wedding and party fashion at a fraction of retail spend.</p>
          </article>
          <article className="glass value-card">
            <CheckCircle2 size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.45rem' }} />
            <h3 style={{ marginBottom: '0.35rem' }}>3. Wear and return</h3>
            <p style={{ color: 'var(--text-muted)' }}>Track everything from booking confirmation to return completion in your profile.</p>
          </article>
        </div>
      </section>

      <section className="container" style={{ marginTop: '2.2rem' }}>
        <div className="glass home-trust-strip">
          <div>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              "Booked my cousin's wedding event outfit in minutes. Clear pricing and date availability made it stress-free."
            </p>
            <p style={{ marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>- Verified renter, Mumbai</p>
          </div>
          <div className="trust-points">
            <span><ShieldCheck size={15} /> Verified bookings</span>
            <span><Truck size={15} /> Easy returns</span>
            <span><Sparkles size={15} /> Curated fashion</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
