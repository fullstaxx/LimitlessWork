import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useUserService, UserProfile } from '../services/UserService';
import { useListingService } from '../services/ListingService';

const CreateListingPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const { fetchUserProfile } = useUserService();
  const { createListing } = useListingService();

  const STUB_MODE = process.env.REACT_APP_USE_STUBS === 'true';

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // form fields
  const [listingId, setListingId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [standardPrice, setStandardPrice] = useState('');
  const [deluxePrice, setDeluxePrice] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (STUB_MODE) {
        if (mounted) setLoading(false);
        return;
      }
      if (!connected || !publicKey) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const prof = await fetchUserProfile(publicKey as PublicKey);
        if (mounted) setUserProfile(prof);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STUB_MODE, connected, publicKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-2 border-b-2" />
      </div>
    );
  }
  if (!connected) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Connect Your Wallet</h2>
        <p>Please connect to create a listing.</p>
      </div>
    );
  }
  if (!STUB_MODE && !userProfile) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Profile Required</h2>
        <p>You need a profile to create listings.</p>
        <button onClick={() => navigate('/profile')} className="mt-4 px-4 py-2 bg-primary text-white rounded">
          Create Profile
        </button>
      </div>
    );
  }
  const isFreelancer =
    STUB_MODE || ('freelancer' in (userProfile?.userType || {}));
  if (!isFreelancer) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Freelancer Only</h2>
        <p>Please update your profile to a freelancer account.</p>
        <button onClick={() => navigate('/profile')} className="mt-4 px-4 py-2 bg-primary text-white rounded">
          Update Profile
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!listingId || !title || !description || !category || !standardPrice) {
      setError('Fill all required fields.');
      return;
    }
    setSubmitting(true);
    const std = parseFloat(standardPrice);
    const del = deluxePrice ? parseFloat(deluxePrice) : undefined;
    const prem = premiumPrice ? parseFloat(premiumPrice) : undefined;
    const ok = await createListing(listingId, title, description, category, std, del, prem);
    setSubmitting(false);
    if (ok) navigate('/my-services');
    else setError('Failed to create listing.');
  };

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Create New Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
          {/* Listing ID */}
          <div>
            <label>Listing ID *</label>
            <input
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Title */}
          <div>
            <label>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Description */}
          <div>
            <label>Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Category */}
          <div>
            <label>Category *</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Standard Price */}
          <div>
            <label>Standard Price (SOL) *</label>
            <input
              type="number"
              step="0.01"
              value={standardPrice}
              onChange={(e) => setStandardPrice(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Deluxe Price */}
          <div>
            <label>Deluxe Price (SOL)</label>
            <input
              type="number"
              step="0.01"
              value={deluxePrice}
              onChange={(e) => setDeluxePrice(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Premium Price */}
          <div>
            <label>Premium Price (SOL)</label>
            <input
              type="number"
              step="0.01"
              value={premiumPrice}
              onChange={(e) => setPremiumPrice(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Submit */}
          <div className="text-right">
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded text-white bg-primary ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Creating…' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;
