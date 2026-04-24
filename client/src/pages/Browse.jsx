import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import ClothCard from '../components/ClothCard';
import { Search, Sparkles, SlidersHorizontal, Wand2, ChevronDown } from 'lucide-react';

const Browse = () => {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialOccasion = searchParams.get('occasion') || searchParams.get('category') || '';

  const [occasionFilter, setOccasionFilter] = useState(initialOccasion);
  const [genderFilter, setGenderFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [sizeFilter, setSizeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setOccasionFilter(params.get('occasion') || params.get('category') || '');
  }, [location.search]);

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const params = new URLSearchParams();
        if (occasionFilter) params.set('occasion', occasionFilter);
        if (genderFilter) params.set('gender', genderFilter);
        if (availabilityFilter !== 'all') params.set('availability', availabilityFilter);
        if (sizeFilter) params.set('size', sizeFilter);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const url = params.toString() ? `/clothes?${params.toString()}` : '/clothes';
        const res = await api.get(url);
        setClothes(res.data);
      } catch (error) {
        console.error('Error fetching clothes', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClothes();
  }, [occasionFilter, genderFilter, availabilityFilter, sizeFilter, minPrice, maxPrice, startDate, endDate]);

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const visibleClothes = clothes
    .filter((cloth) => {
      if (!normalizedQuery) return true;
      const haystack = `${cloth.title} ${cloth.description} ${cloth.category} ${cloth.occasion || ''} ${cloth.gender || ''} ${cloth.size}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'priceDesc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const activeFiltersCount = useMemo(() => (
    [
      occasionFilter,
      genderFilter,
      availabilityFilter !== 'all',
      searchTerm.trim(),
      sortBy !== 'featured',
      sizeFilter.trim(),
      minPrice.trim(),
      maxPrice.trim(),
      startDate,
      endDate,
    ].filter(Boolean).length
  ), [occasionFilter, genderFilter, availabilityFilter, searchTerm, sortBy, sizeFilter, minPrice, maxPrice, startDate, endDate]);

  const availableCount = useMemo(
    () => visibleClothes.filter((cloth) => cloth.availability).length,
    [visibleClothes]
  );

  const averageDailyPrice = useMemo(() => {
    if (!visibleClothes.length) return 0;
    const total = visibleClothes.reduce((sum, cloth) => sum + (Number(cloth.pricePerDay) || 0), 0);
    return Math.round(total / visibleClothes.length);
  }, [visibleClothes]);

  const clearFilters = () => {
    setOccasionFilter('');
    setGenderFilter('');
    setAvailabilityFilter('all');
    setSearchTerm('');
    setSortBy('featured');
    setSizeFilter('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setShowAdvancedFilters(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading catalog...</div>;

  return (
    <div className="browse-page">
      <section className="glass browse-hero browse-shell-surface">
        <div className="browse-hero-copy">
          <span className="browse-eyebrow"><Sparkles size={14} /> Catalog</span>
          <h1>Find the right look faster.</h1>
          <p className="browse-hero-note" title="Search by style, fit, availability, price, and date to find event-ready pieces faster.">Use the filters to narrow the catalog quickly.</p>
        </div>

        <div className="browse-stats-row">
          <div className="browse-stat-chip">
            <span className="browse-stat-label">Results</span>
            <strong>{visibleClothes.length}</strong>
          </div>
          <div className="browse-stat-chip">
            <span className="browse-stat-label">Available now</span>
            <strong>{availableCount}</strong>
          </div>
          <div className="browse-stat-chip">
            <span className="browse-stat-label">Avg/day</span>
            <strong>{averageDailyPrice ? `INR ${averageDailyPrice}` : 'INR 0'}</strong>
          </div>
          <div className="browse-stat-chip">
            <span className="browse-stat-label">Active filters</span>
            <strong>{activeFiltersCount}</strong>
          </div>
        </div>
      </section>

      <div className="browse-chip-row">
        {['', 'wedding', 'party', 'casual'].map((cat) => (
          <button
            key={cat}
            className={`btn ${occasionFilter === cat ? 'btn-primary' : 'btn-outline'} browse-chip ${occasionFilter === cat ? 'is-active' : ''}`}
            onClick={() => setOccasionFilter(cat)}
            style={{ textTransform: 'capitalize' }}
          >
            {cat === '' ? 'All' : cat}
          </button>
        ))}
      </div>

      <section className="glass browse-toolbar browse-shell-surface">
        <div className="browse-toolbar-main">
          <div className="form-group browse-search-field" style={{ marginBottom: 0 }}>
            <label>Search catalog</label>
            <div className="browse-search-input-shell">
              <Search size={16} className="browse-search-field-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, category, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group browse-sort-field" style={{ marginBottom: 0 }}>
            <label>Sort</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="latest">Newest</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

          <div className="browse-results-pill">{visibleClothes.length} items</div>
        </div>

        <div className="browse-toolbar-actions">
          <button
            type="button"
            className={`btn btn-outline browse-filter-toggle ${showAdvancedFilters ? 'is-open' : ''}`}
            onClick={() => setShowAdvancedFilters((current) => !current)}
            aria-expanded={showAdvancedFilters}
            aria-controls="browse-advanced-filters"
          >
            <SlidersHorizontal size={14} /> Filters <ChevronDown size={14} />
            {activeFiltersCount > 0 && <span className="filter-active-dot" />}
          </button>

          {activeFiltersCount > 0 && (
            <button type="button" className="btn btn-outline browse-clear-btn" onClick={clearFilters}>
              <Wand2 size={14} /> Clear all
            </button>
          )}
        </div>

        <div
          id="browse-advanced-filters"
          className={`browse-advanced-panel ${showAdvancedFilters ? 'is-open' : ''}`}
          aria-hidden={!showAdvancedFilters}
        >
            <div className="browse-filters-grid browse-filters-grid-compact">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Gender</label>
            <select className="form-control" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="">All</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Availability</label>
            <select className="form-control" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="true">Currently Available</option>
              <option value="false">Currently Unavailable</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Size</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. M"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            />
          </div>

          <div className="browse-range-group">
            <label>Price range (INR)</label>
            <div className="browse-range-row">
              <input
                type="number"
                className="form-control"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>to</span>
              <input
                type="number"
                className="form-control"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="browse-range-group">
            <label>Available date range</label>
            <div className="browse-range-row">
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                className="form-control"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
            </div>
          </div>
      </section>

      {visibleClothes.length === 0 ? (
        <div className="glass browse-empty-state">
          <Search size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3>No items found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try a different style chip or clear the filters to bring more pieces back.</p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>Reset filters</button>
        </div>
      ) : (
        <div className="browse-grid">
          {visibleClothes.map((cloth) => (
            <ClothCard key={cloth._id} cloth={cloth} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
