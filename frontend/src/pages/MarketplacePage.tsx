import React, { useEffect, useState, useMemo } from 'react';
import { useListingService, Listing } from '../services/ListingService';
import { ListingCard } from '../components/marketplace/ListingCard';

const MarketplacePage: React.FC = () => {
  const { fetchAllListings, fetchMyListings } = useListingService();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // stub-mode toggle
  const STUB_MODE = process.env.REACT_APP_USE_STUBS === 'true';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // A: only your listings (fast & no 429)
        const raw = STUB_MODE
          ? await fetchMyListings()
          : await fetchMyListings();

        if (!mounted) return;
        setListings(raw.filter((l) => l.active));
      } catch (err) {
        console.error('Error loading listings:', err);
        if (mounted) setError('Failed to load listings.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [fetchMyListings, STUB_MODE]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(listings.map((l) => l.category)))],
    [listings]
  );

  const filtered =
    selectedCategory === 'All'
      ? listings
      : listings.filter((l) => l.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">
          Try Again
        </button>
      </div>
    );
  }
  if (!filtered.length) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">No services found.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Services Marketplace</h1>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.pda.toBase58()}
              listing={listing}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
