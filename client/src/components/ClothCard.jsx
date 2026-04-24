import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const ClothCard = ({ cloth }) => {
  const imageUrl = getClothImageSrc(cloth);

  return (
    <div className="glass catalog-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="catalog-card-img-wrap">
        <img
          src={imageUrl}
          alt={cloth.title}
          className="catalog-card-image"
          onError={(e) => { e.target.src = getClothImageSrc({ title: cloth.title, category: cloth.category }); }}
        />
        <div className="catalog-card-badges">
          <span className="catalog-badge catalog-badge-category">{cloth.category}</span>
          <span className="catalog-badge catalog-badge-gender">{cloth.size}</span>
        </div>
        <Link
          to={`/cloth/${cloth._id}`}
          className="catalog-image-cta"
          aria-disabled={!cloth.availability}
          style={{ pointerEvents: cloth.availability ? 'auto' : 'none' }}
        >
          <span>{cloth.availability ? 'View details' : 'Not available'}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ padding: '1rem 1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', flexGrow: 1 }}>
        <div>
          <h3 style={{ fontSize: '1.06rem', marginBottom: '0.3rem', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{cloth.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55, minHeight: '2.9em' }}>
            {cloth.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="catalog-avail-badge" style={{ background: cloth.availability ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: cloth.availability ? 'var(--success)' : 'var(--danger)' }}>
            {cloth.availability ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ fontSize: '1.06rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {formatINR(cloth.pricePerDay)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span>
          </span>
          <Link
            to={`/cloth/${cloth._id}`}
            className={`btn ${cloth.availability ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '0.55rem 1rem',
              pointerEvents: cloth.availability ? 'auto' : 'none',
              opacity: cloth.availability ? 1 : 0.6,
              minWidth: '118px'
            }}
            aria-disabled={!cloth.availability}
          >
            {cloth.availability ? 'Details' : 'Not Available'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClothCard;
