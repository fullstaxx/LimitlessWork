import React, { useEffect, useState } from 'react';
import { useListingService, Listing } from '../services/ListingService';
import { ListingCard } from '../components/marketplace/ListingCard';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '../contexts/ProgramContext';

const MyServicesPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { program } = useProgram();
  const { fetchMyListings } = useListingService();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Only fetch once we have a connected wallet AND the program is initialized
    if (!connected || !publicKey || !program) {
      return;
    }

    const loadMine = async () => {
      setLoading(true);
      setError('');
      try {
        const my = await fetchMyListings();
        setListings(my);
      } catch (err) {
        console.error('Error loading your services:', err);
        setError('Failed to load your services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMine();
  }, [connected, publicKey, program]); // will only re-run if those change

  // 1) Not connected → prompt
  if (!connected) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">
          Please connect your wallet to view your services.
        </p>
      </div>
    );
  }

  // 2) Still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 3) Error
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      </div>
    );
  }

  // 4) No listings
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">You have no services listed yet.</p>
      </div>
    );
  }

  // 5) Render your listings
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Services</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.authority.toBase58() + listing.title}
              listing={listing}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyServicesPage;
